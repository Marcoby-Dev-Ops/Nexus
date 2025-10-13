-- Migration: Journey System Tables
-- Split from 088_create_unified_playbook_journey_system.sql

-- User Journeys
CREATE TABLE IF NOT EXISTS user_journeys (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  playbook_id TEXT NOT NULL,
  status TEXT CHECK (status IN ('not_started', 'in_progress', 'completed', 'paused')) DEFAULT 'not_started',
  current_step INTEGER DEFAULT 1,
  total_steps INTEGER NOT NULL,
  progress_percentage REAL DEFAULT 0,
  step_responses JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Step Responses
CREATE TABLE IF NOT EXISTS step_responses (
  id TEXT PRIMARY KEY,
  journey_id TEXT NOT NULL REFERENCES user_journeys(id) ON DELETE CASCADE,
  step_id TEXT NOT NULL,
  response JSONB NOT NULL,
  completed_at TIMESTAMP DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'
);

-- Journey Analytics
CREATE TABLE IF NOT EXISTS journey_analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  journey_id TEXT NOT NULL,
  completion_duration INTEGER,
  response_count INTEGER DEFAULT 0,
  maturity_assessment JSONB,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Journey Context Notes
CREATE TABLE IF NOT EXISTS journey_context_notes (
  id TEXT PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  journey_id TEXT NOT NULL,
  step_id TEXT NOT NULL,
  note_type TEXT NOT NULL CHECK (note_type IN ('insight', 'pattern', 'recommendation', 'learning')),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  confidence DECIMAL(3,2) NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
