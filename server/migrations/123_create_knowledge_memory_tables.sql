-- Migration: Create Knowledge Memory Tables
-- Description: Foundation schema for subject/horizon based AI operating memory

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Canonical memory facts across subject (user|agent|shared) and horizon (short|medium|long)
CREATE TABLE IF NOT EXISTS knowledge_facts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subject_type VARCHAR(20) NOT NULL CHECK (subject_type IN ('user', 'agent', 'shared')),
    subject_id VARCHAR(255) NOT NULL,
    horizon VARCHAR(20) NOT NULL CHECK (horizon IN ('short', 'medium', 'long')),
    domain VARCHAR(100) NOT NULL DEFAULT 'general',
    fact_key VARCHAR(255) NOT NULL,
    fact_value JSONB NOT NULL DEFAULT '{}'::jsonb,
    source VARCHAR(120) NOT NULL DEFAULT 'system',
    confidence NUMERIC(4,3) NOT NULL DEFAULT 0.800 CHECK (confidence >= 0 AND confidence <= 1),
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'stale', 'conflicted', 'deprecated')),
    ttl_seconds INTEGER CHECK (ttl_seconds IS NULL OR ttl_seconds > 0),
    expires_at TIMESTAMP WITH TIME ZONE NULL,
    tags TEXT[] NOT NULL DEFAULT '{}',
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_by VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_knowledge_facts_subject_horizon_domain_key
      UNIQUE (subject_type, subject_id, horizon, domain, fact_key)
);

-- Optional evidence trail for each fact
CREATE TABLE IF NOT EXISTS knowledge_fact_evidence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fact_id UUID NOT NULL REFERENCES knowledge_facts(id) ON DELETE CASCADE,
    evidence_type VARCHAR(50) NOT NULL DEFAULT 'note',
    evidence_ref VARCHAR(255),
    evidence_text TEXT,
    weight NUMERIC(4,3) NOT NULL DEFAULT 0.500 CHECK (weight >= 0 AND weight <= 1),
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_knowledge_facts_subject
  ON knowledge_facts(subject_type, subject_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_facts_horizon_status
  ON knowledge_facts(horizon, status, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_knowledge_facts_domain
  ON knowledge_facts(domain);
CREATE INDEX IF NOT EXISTS idx_knowledge_facts_expires_at
  ON knowledge_facts(expires_at)
  WHERE expires_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_knowledge_facts_tags
  ON knowledge_facts USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_knowledge_facts_value
  ON knowledge_facts USING GIN(fact_value);

CREATE INDEX IF NOT EXISTS idx_knowledge_fact_evidence_fact_id
  ON knowledge_fact_evidence(fact_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_knowledge_fact_evidence_type
  ON knowledge_fact_evidence(evidence_type);

-- Keep updated_at current for mutable facts
CREATE OR REPLACE FUNCTION update_knowledge_facts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_knowledge_facts_updated_at ON knowledge_facts;
CREATE TRIGGER trigger_update_knowledge_facts_updated_at
    BEFORE UPDATE ON knowledge_facts
    FOR EACH ROW
    EXECUTE FUNCTION update_knowledge_facts_updated_at();

-- Ensure short-horizon facts can auto-expire from ttl_seconds
CREATE OR REPLACE FUNCTION set_knowledge_fact_expiry()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.ttl_seconds IS NOT NULL AND NEW.expires_at IS NULL THEN
        NEW.expires_at = NOW() + make_interval(secs => NEW.ttl_seconds);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_knowledge_fact_expiry ON knowledge_facts;
CREATE TRIGGER trigger_set_knowledge_fact_expiry
    BEFORE INSERT OR UPDATE ON knowledge_facts
    FOR EACH ROW
    EXECUTE FUNCTION set_knowledge_fact_expiry();

-- Useful for deterministic context assembly: only active + unexpired facts
CREATE OR REPLACE VIEW knowledge_active_facts AS
SELECT *
FROM knowledge_facts
WHERE status = 'active'
  AND (expires_at IS NULL OR expires_at > NOW());

COMMENT ON TABLE knowledge_facts IS 'Structured memory facts for AI operating system, keyed by subject and horizon';
COMMENT ON COLUMN knowledge_facts.subject_type IS 'Memory subject type: user, agent, or shared';
COMMENT ON COLUMN knowledge_facts.subject_id IS 'Subject identifier (e.g. user_id, agent_id, company_id/global)';
COMMENT ON COLUMN knowledge_facts.horizon IS 'Memory horizon: short, medium, long';
COMMENT ON COLUMN knowledge_facts.ttl_seconds IS 'Optional TTL for time-bound facts';
COMMENT ON TABLE knowledge_fact_evidence IS 'Evidence entries supporting confidence and provenance of a memory fact';
COMMENT ON VIEW knowledge_active_facts IS 'Convenience view for currently-active, non-expired knowledge facts';
