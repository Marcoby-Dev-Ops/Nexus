-- Create tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'completed', 'cancelled')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  due_date TIMESTAMP WITH TIME ZONE,
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  tags TEXT[] DEFAULT '{}',
  estimated_hours DECIMAL(10,2),
  actual_hours DECIMAL(10,2),
  parent_task_id UUID REFERENCES tasks(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tasks_created_by ON tasks(created_by);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_parent_task_id ON tasks(parent_task_id);
CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON tasks(created_at);

-- Enable Row Level Security
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own tasks" ON tasks
  FOR SELECT USING (
    auth.uid() = created_by OR 
    auth.uid() = assigned_to
  );

CREATE POLICY "Users can insert their own tasks" ON tasks
  FOR INSERT WITH CHECK (
    auth.uid() = created_by
  );

CREATE POLICY "Users can update their own tasks" ON tasks
  FOR UPDATE USING (
    auth.uid() = created_by OR 
    auth.uid() = assigned_to
  );

CREATE POLICY "Users can delete their own tasks" ON tasks
  FOR DELETE USING (
    auth.uid() = created_by
  );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_tasks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_tasks_updated_at_trigger
  BEFORE UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_tasks_updated_at(); 