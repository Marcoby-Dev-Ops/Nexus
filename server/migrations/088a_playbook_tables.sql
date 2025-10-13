-- Migration: Playbook System Tables
-- Split from 088_create_unified_playbook_journey_system.sql

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Playbook Templates
CREATE TABLE IF NOT EXISTS playbook_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    version VARCHAR(50) DEFAULT '1.0.0',
    is_active BOOLEAN DEFAULT true,
    category VARCHAR(100),
    estimated_duration_hours INTEGER,
    prerequisites JSONB DEFAULT '[]',
    priority INTEGER DEFAULT 0,
    complexity VARCHAR(50) DEFAULT 'beginner',
    success_metrics JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Playbook Items
CREATE TABLE IF NOT EXISTS playbook_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    playbook_id UUID NOT NULL REFERENCES playbook_templates(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    item_type VARCHAR(50) NOT NULL CHECK (item_type IN ('step', 'task', 'milestone', 'checklist')),
    order_index INTEGER NOT NULL,
    is_required BOOLEAN DEFAULT true,
    estimated_duration_minutes INTEGER,
    validation_schema JSONB DEFAULT '{}',
    component_name VARCHAR(255),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Playbook Responses
CREATE TABLE IF NOT EXISTS user_playbook_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(255) NOT NULL,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    playbook_id UUID NOT NULL REFERENCES playbook_templates(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES playbook_items(id) ON DELETE CASCADE,
    ticket_id UUID,
    response_data JSONB DEFAULT '{}',
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
