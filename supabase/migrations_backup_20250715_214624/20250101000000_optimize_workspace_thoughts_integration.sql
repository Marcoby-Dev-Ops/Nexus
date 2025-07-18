-- Migration: Optimize thoughts table for workspace integration
-- Adds columns for better department routing, priority tracking, and AI clarification data

-- Add new columns to thoughts table
ALTER TABLE thoughts 
ADD COLUMN IF NOT EXISTS department VARCHAR(50),
ADD COLUMN IF NOT EXISTS priority VARCHAR(20) CHECK (priority IN ('low', 'medium', 'high')),
ADD COLUMN IF NOT EXISTS estimated_effort VARCHAR(50),
ADD COLUMN IF NOT EXISTS ai_clarification_data JSONB;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_thoughts_department ON thoughts(department);
CREATE INDEX IF NOT EXISTS idx_thoughts_priority ON thoughts(priority);
CREATE INDEX IF NOT EXISTS idx_thoughts_parent_idea_id ON thoughts(parent_idea_id);

-- Add comments for documentation
COMMENT ON COLUMN thoughts.department IS 'Department this thought belongs to (Marketing, Sales, Support, Operations, Finance)';
COMMENT ON COLUMN thoughts.priority IS 'Priority level assigned by AI or user (low, medium, high)';
COMMENT ON COLUMN thoughts.estimated_effort IS 'Estimated time/effort for completion (e.g., "1-2 days", "2-3 weeks")';
COMMENT ON COLUMN thoughts.ai_clarification_data IS 'Structured data from AI clarification including breakdown, reasoning, and suggestions';

-- Update RLS policies to include new columns
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

-- Create a function to update thought with workspace data
CREATE OR REPLACE FUNCTION update_thought_with_workspace_data(
  thought_id UUID,
  new_department VARCHAR(50),
  new_priority VARCHAR(20),
  new_estimated_effort VARCHAR(50),
  new_ai_data JSONB
)
RETURNS thoughts AS $$
DECLARE
  updated_thought thoughts;
BEGIN
  UPDATE thoughts 
  SET 
    department = COALESCE(new_department, department),
    priority = COALESCE(new_priority, priority),
    estimated_effort = COALESCE(new_estimated_effort, estimated_effort),
    ai_clarification_data = COALESCE(new_ai_data, ai_clarification_data),
    updated_at = NOW()
  WHERE id = thought_id AND user_id = auth.uid()
  RETURNING * INTO updated_thought;
  
  RETURN updated_thought;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION update_thought_with_workspace_data(UUID, VARCHAR(50), VARCHAR(20), VARCHAR(50), JSONB) TO authenticated;

-- Create a view for workspace action plans
CREATE OR REPLACE VIEW workspace_action_plans AS
SELECT 
  t.id,
  t.content,
  t.category,
  t.status,
  t.department,
  t.priority,
  t.estimated_effort,
  t.initiative,
  t.workflow_stage,
  t.created_at,
  t.updated_at,
  t.user_id,
  -- Count related tasks
  (SELECT COUNT(*) FROM thoughts child WHERE child.parent_idea_id = t.id AND child.category = 'task') as task_count,
  -- Count completed tasks
  (SELECT COUNT(*) FROM thoughts child WHERE child.parent_idea_id = t.id AND child.category = 'task' AND child.status = 'completed') as completed_tasks,
  -- Calculate progress percentage
  CASE 
    WHEN (SELECT COUNT(*) FROM thoughts child WHERE child.parent_idea_id = t.id AND child.category = 'task') > 0 
    THEN ROUND(
      (SELECT COUNT(*) FROM thoughts child WHERE child.parent_idea_id = t.id AND child.category = 'task' AND child.status = 'completed')::DECIMAL / 
      (SELECT COUNT(*) FROM thoughts child WHERE child.parent_idea_id = t.id AND child.category = 'task')::DECIMAL * 100
    )
    ELSE 0
  END as progress_percentage
FROM thoughts t
WHERE t.initiative = true 
  AND t.workflow_stage IN ('create_idea', 'update_idea', 'implement_idea')
  AND t.user_id = auth.uid();

-- Grant access to the view
GRANT SELECT ON workspace_action_plans TO authenticated;

-- Note: Views don't support RLS policies directly
-- The view already filters by auth.uid() = user_id, so no additional policy is needed

-- Add trigger to update progress when child tasks change
CREATE OR REPLACE FUNCTION update_parent_progress()
RETURNS TRIGGER AS $$
BEGIN
  -- Update parent thought's updated_at when child task changes
  IF NEW.parent_idea_id IS NOT NULL THEN
    UPDATE thoughts 
    SET updated_at = NOW()
    WHERE id = NEW.parent_idea_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_update_parent_progress ON thoughts;
CREATE TRIGGER trigger_update_parent_progress
  AFTER UPDATE ON thoughts
  FOR EACH ROW
  EXECUTE FUNCTION update_parent_progress(); 