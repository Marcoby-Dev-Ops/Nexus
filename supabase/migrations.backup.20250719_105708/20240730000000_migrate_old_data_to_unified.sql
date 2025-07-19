-- Migration: Migrate old data to unified schema (thoughts, tasks)
-- Safe to run multiple times (idempotent)

-- 1. Migrate personal_thoughts to thoughts
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'personal_thoughts') THEN
    INSERT INTO thoughts (id, content, type, created_by, workspace_id, parent_thought_id, created_at, updated_at)
    SELECT
      id,
      content,
      COALESCE(category, 'idea') AS type,
      user_id AS created_by,
      workspace_id,
      parent_idea_id AS parent_thought_id,
      created_at,
      updated_at
    FROM personal_thoughts
    ON CONFLICT (id) DO NOTHING;
  END IF;
END $$;

-- 2. Migrate manual_tasks to tasks
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'manual_tasks') THEN
    INSERT INTO tasks (id, title, description, status, priority, due_date, assigned_to, workspace_id, related_thought_id, created_by, created_at, updated_at)
    SELECT
      id,
      title,
      description,
      status,
      priority,
      due_date,
      assigned_to,
      workspace_id,
      related_idea_id AS related_thought_id,
      created_by,
      created_at,
      updated_at
    FROM manual_tasks
    ON CONFLICT (id) DO NOTHING;
  END IF;
END $$;

-- 3. Migrate activities to tasks
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'activities') THEN
    INSERT INTO tasks (id, title, description, status, priority, due_date, assigned_to, workspace_id, related_thought_id, created_by, created_at, updated_at)
    SELECT
      id,
      name AS title,
      details AS description,
      status,
      priority,
      due_date,
      assigned_to,
      workspace_id,
      related_idea_id AS related_thought_id,
      created_by,
      created_at,
      updated_at
    FROM activities
    ON CONFLICT (id) DO NOTHING;
  END IF;
END $$;

-- 4. Migrate goal_assessments to tasks (as type = 'goal_assessment')
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'goal_assessments') THEN
    INSERT INTO tasks (id, title, description, status, priority, due_date, assigned_to, workspace_id, related_thought_id, created_by, created_at, updated_at)
    SELECT
      id,
      goal_title AS title,
      assessment_notes AS description,
      status,
      priority,
      due_date,
      assigned_to,
      workspace_id,
      related_idea_id AS related_thought_id,
      created_by,
      created_at,
      updated_at
    FROM goal_assessments
    ON CONFLICT (id) DO NOTHING;
  END IF;
END $$;

-- Add more migrations as needed for other tables... 