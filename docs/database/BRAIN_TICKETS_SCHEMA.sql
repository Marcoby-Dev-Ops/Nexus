-- Brain Tickets Schema
-- Stores all brain ticket types including Identity Setup, Revenue Setup, etc.

CREATE TABLE IF NOT EXISTS brain_tickets (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  type VARCHAR(100) NOT NULL, -- 'identity_setup', 'revenue_setup', 'cashflow_setup', etc.
  status VARCHAR(50) NOT NULL DEFAULT 'active', -- 'active', 'paused', 'completed', 'abandoned'
  priority VARCHAR(20) DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
  
  -- Ticket metadata
  title VARCHAR(255),
  description TEXT,
  
  -- Ticket data (JSON structure varies by type)
  data JSONB NOT NULL,
  
  -- Progress tracking
  progress INTEGER DEFAULT 0, -- 0-100%
  current_phase VARCHAR(100),
  completed_phases TEXT[], -- Array of completed phase IDs
  
  -- Conversation tracking
  message_count INTEGER DEFAULT 0,
  last_message_at TIMESTAMP WITH TIME ZONE,
  
  -- Events and audit trail
  events JSONB DEFAULT '[]'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  
  -- Indexes
  CONSTRAINT brain_tickets_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_brain_tickets_user_id ON brain_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_brain_tickets_type ON brain_tickets(type);
CREATE INDEX IF NOT EXISTS idx_brain_tickets_status ON brain_tickets(status);
CREATE INDEX IF NOT EXISTS idx_brain_tickets_created_at ON brain_tickets(created_at);
CREATE INDEX IF NOT EXISTS idx_brain_tickets_user_type_status ON brain_tickets(user_id, type, status);

-- Composite index for active tickets
CREATE INDEX IF NOT EXISTS idx_brain_tickets_active ON brain_tickets(user_id, status) WHERE status = 'active';

-- GIN index for JSON data queries
CREATE INDEX IF NOT EXISTS idx_brain_tickets_data_gin ON brain_tickets USING GIN (data);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_brain_tickets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER trigger_update_brain_tickets_updated_at
  BEFORE UPDATE ON brain_tickets
  FOR EACH ROW
  EXECUTE FUNCTION update_brain_tickets_updated_at();

-- Function to calculate progress from ticket data
CREATE OR REPLACE FUNCTION calculate_ticket_progress(ticket_data JSONB)
RETURNS INTEGER AS $$
DECLARE
  total_blocks INTEGER;
  completed_blocks INTEGER;
BEGIN
  -- For identity setup tickets
  IF ticket_data->>'type' = 'identity_setup' THEN
    total_blocks := 7; -- 7 building blocks
    completed_blocks := jsonb_array_length(ticket_data->'conversation'->'completedBlocks');
    RETURN ROUND((completed_blocks::FLOAT / total_blocks) * 100);
  END IF;
  
  -- Default progress calculation
  RETURN COALESCE((ticket_data->>'progress')::INTEGER, 0);
END;
$$ LANGUAGE plpgsql;

-- View for active tickets with calculated progress
CREATE OR REPLACE VIEW active_brain_tickets AS
SELECT 
  bt.id,
  bt.user_id,
  bt.type,
  bt.status,
  bt.priority,
  bt.title,
  bt.description,
  bt.data,
  calculate_ticket_progress(bt.data) as calculated_progress,
  bt.current_phase,
  bt.completed_phases,
  bt.message_count,
  bt.last_message_at,
  bt.events,
  bt.created_at,
  bt.updated_at,
  bt.completed_at,
  u.email as user_email,
  up.first_name,
  up.last_name,
  up.company_name
FROM brain_tickets bt
LEFT JOIN users u ON bt.user_id = u.id
LEFT JOIN user_profiles up ON bt.user_id = up.user_id
WHERE bt.status = 'active'
ORDER BY bt.created_at DESC;

-- Function to get ticket statistics
CREATE OR REPLACE FUNCTION get_ticket_statistics(user_id_param VARCHAR(255))
RETURNS TABLE (
  total_tickets INTEGER,
  active_tickets INTEGER,
  completed_tickets INTEGER,
  avg_completion_time INTERVAL,
  most_common_type VARCHAR(100)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::INTEGER as total_tickets,
    COUNT(*) FILTER (WHERE status = 'active')::INTEGER as active_tickets,
    COUNT(*) FILTER (WHERE status = 'completed')::INTEGER as completed_tickets,
    AVG(completed_at - created_at) FILTER (WHERE status = 'completed') as avg_completion_time,
    MODE() WITHIN GROUP (ORDER BY type) as most_common_type
  FROM brain_tickets
  WHERE user_id = user_id_param;
END;
$$ LANGUAGE plpgsql;

-- Function to clean up abandoned tickets (older than 30 days)
CREATE OR REPLACE FUNCTION cleanup_abandoned_tickets()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  UPDATE brain_tickets 
  SET status = 'abandoned'
  WHERE status = 'active' 
    AND updated_at < NOW() - INTERVAL '30 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Comments for documentation
COMMENT ON TABLE brain_tickets IS 'Stores all brain ticket types for user interactions with Nexus AI';
COMMENT ON COLUMN brain_tickets.type IS 'Type of brain ticket: identity_setup, revenue_setup, cashflow_setup, etc.';
COMMENT ON COLUMN brain_tickets.data IS 'JSON structure containing ticket-specific data and conversation history';
COMMENT ON COLUMN brain_tickets.events IS 'Array of events emitted during ticket lifecycle';
COMMENT ON FUNCTION calculate_ticket_progress(JSONB) IS 'Calculates progress percentage based on ticket type and data';
COMMENT ON VIEW active_brain_tickets IS 'View of all active tickets with user information and calculated progress';
