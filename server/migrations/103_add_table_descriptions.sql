-- Migration: Add Comprehensive Table Descriptions
-- Description: Adds detailed comments to all tables explaining their purpose in the Nexus system
-- This migration documents the role of each table in the 7-domain Nexus architecture

-- ============================================================================
-- CORE IDENTITY & ORGANIZATION MANAGEMENT
-- ============================================================================

-- Organizations table - External business relationships and CRM entities
COMMENT ON TABLE organizations IS 'External business relationships and CRM entities. Manages clients, vendors, partners, suppliers, and other external organizations that users interact with. Supports many-to-many relationships for business networking and relationship management.';

-- User Organizations - External business relationship management
COMMENT ON TABLE user_organizations IS 'User membership in external organizations. Manages relationships between users and external business entities (clients, vendors, partners) with role-based permissions and access levels for business networking and CRM functionality.';

-- User Profiles - Comprehensive user information and business context
COMMENT ON TABLE user_profiles IS 'Comprehensive user profile management with business context. Stores personal information, professional details, company associations, and business profile data. Integrates with Authentik for identity management and supports the Identity domain of Nexus.';

-- User Preferences - User-specific application settings and preferences
COMMENT ON TABLE user_preferences IS 'User-specific application preferences and settings. Manages UI preferences, notification settings, and personalized application configuration. Supports user experience customization across the Nexus platform.';

-- ============================================================================
-- INTERNAL BUSINESS OPERATIONS
-- ============================================================================

-- Companies table - Internal business entity for billing, permissions, and operations
COMMENT ON TABLE companies IS 'Internal business entity for user''s own company. Manages billing, subscription plans, user permissions, active user limits, and business context. Each user has one company that represents their business for operational purposes.';

-- Company Members - Legacy user-company relationships (being phased out)
COMMENT ON TABLE company_members IS 'Legacy junction table for user-company relationships. Being replaced by direct company_id in user_profiles as part of the business model consolidation. Maintains existing relationships during transition period.';

-- ============================================================================
-- AI & CONVERSATION SYSTEM
-- ============================================================================

-- AI Conversations - High-level conversation metadata and context
COMMENT ON TABLE ai_conversations IS 'AI conversation management system. Stores conversation metadata, context, and configuration for AI chat sessions. Tracks token usage, costs, and conversation state across the Nexus AI ecosystem.';

-- AI Messages - Individual messages within conversations
COMMENT ON TABLE ai_messages IS 'Individual AI chat messages with enhanced metadata. Stores user and assistant messages with conversation context, role information, and message-specific metadata for AI conversation tracking.';

-- AI Experts - Specialized AI agents for different business domains
COMMENT ON TABLE ai_experts IS 'AI expert system for domain-specific business assistance. Defines specialized AI agents for each of the 7 Nexus domains (Identity, Revenue, Cash, Delivery, People, Knowledge, Systems) with expertise areas and switching rules.';

-- AI Expert Prompts - Contextual prompts for AI experts
COMMENT ON TABLE ai_expert_prompts IS 'Contextual prompt management for AI experts. Stores different prompt variations and trigger conditions for AI experts to provide domain-specific, contextual assistance based on user needs and conversation state.';

-- Expert Performance - Performance tracking for AI experts
COMMENT ON TABLE expert_performance IS 'Performance analytics for AI expert system. Tracks expert switching, user satisfaction, response quality, and conversation effectiveness to optimize AI assistance across business domains.';

-- Expert Switching Rules - Rules for automatic expert selection
COMMENT ON TABLE expert_switching_rules IS 'Automated expert selection rules. Defines conditions and triggers for switching between AI experts based on conversation context, user needs, and business domain requirements.';

-- ============================================================================
-- KNOWLEDGE MANAGEMENT (CKB - Company Knowledge Base)
-- ============================================================================

-- CKB Documents - Company knowledge base documents with vector embeddings
COMMENT ON TABLE ckb_documents IS 'Company Knowledge Base (CKB) document storage with semantic search capabilities. Stores business documents, policies, and knowledge with vector embeddings for AI-powered semantic search and retrieval.';

-- CKB Search Logs - Analytics for knowledge base usage
COMMENT ON TABLE ckb_search_logs IS 'Knowledge base search analytics and usage tracking. Records search queries, results, and performance metrics to optimize knowledge discovery and improve search relevance.';

-- CKB Storage Connections - OAuth connections to external storage
COMMENT ON TABLE ckb_storage_connections IS 'External storage integration for knowledge base. Manages OAuth connections to OneDrive, Google Drive, and other storage providers for automated document ingestion and synchronization.';

-- ============================================================================
-- BUSINESS ASSESSMENT & MATURITY FRAMEWORK
-- ============================================================================

-- Business Health Snapshots - Overall business health assessments
COMMENT ON TABLE business_health_snapshots IS 'Business health assessment snapshots. Stores comprehensive business health evaluations across all 7 Nexus domains with scoring, trends, and improvement recommendations.';

-- Maturity Assessments - Detailed maturity evaluations
COMMENT ON TABLE maturity_assessments IS 'Business maturity assessment results. Detailed evaluations of business maturity across different domains with scoring, recommendations, and improvement tracking over time.';

-- Maturity Domains - Assessment domain definitions
COMMENT ON TABLE maturity_domains IS 'Business maturity assessment domains. Defines the assessment categories and their relative importance weights for comprehensive business maturity evaluation.';

-- Maturity Questions - Assessment questions and criteria
COMMENT ON TABLE maturity_questions IS 'Business maturity assessment questions. Stores the specific questions, criteria, and evaluation methods used in business maturity assessments across different domains.';

-- ============================================================================
-- BUILDING BLOCKS SYSTEM
-- ============================================================================

-- Building Blocks - Reusable business improvement components
COMMENT ON TABLE building_blocks IS 'Business building blocks for systematic improvement. Defines reusable components, processes, and strategies that can be implemented to improve business performance across the 7 Nexus domains.';

-- User Building Block Implementations - User-specific building block progress
-- Note: user_building_block_implementations table removed - progress is tracked in user_journeys

-- ============================================================================
-- PLAYBOOK & JOURNEY SYSTEM
-- ============================================================================

-- Playbook Templates - Structured business improvement playbooks
COMMENT ON TABLE playbook_templates IS 'Business improvement playbook templates. Defines structured, step-by-step processes for implementing business improvements across different domains and use cases.';

-- Playbook Items - Individual steps and tasks within playbooks
COMMENT ON TABLE playbook_items IS 'Individual playbook steps and tasks. Defines specific actions, milestones, and checklists within playbook templates for systematic business improvement implementation.';

-- User Playbook Progress - User progress through playbooks
-- Note: user_playbook_progress table removed - progress is tracked in user_journeys

-- User Playbook Responses - User responses to playbook steps
COMMENT ON TABLE user_playbook_responses IS 'User responses to playbook steps and tasks. Stores user input, data, and responses collected during playbook implementation for analysis and progress tracking.';

-- User Journeys - Active user journey instances
COMMENT ON TABLE user_journeys IS 'Active user journey instances. Tracks user progress through business improvement journeys with step-by-step navigation and completion tracking.';

-- Step Responses - Individual step responses within journeys
COMMENT ON TABLE step_responses IS 'Individual step responses within user journeys. Stores user input and responses for specific journey steps with metadata and completion tracking.';

-- Journey Analytics - Journey performance and analytics
COMMENT ON TABLE journey_analytics IS 'Journey performance analytics and insights. Tracks journey completion rates, duration, user engagement, and success metrics for continuous improvement.';

-- Journey Context Notes - Knowledge enhancement from journeys
COMMENT ON TABLE journey_context_notes IS 'Knowledge enhancement from journey interactions. Captures insights, patterns, and recommendations generated during user journeys for knowledge base enrichment.';

-- ============================================================================
-- KNOWLEDGE MAPPING & AUTOMATION
-- ============================================================================

-- Playbook Knowledge Mappings - Links between playbooks and knowledge updates
COMMENT ON TABLE playbook_knowledge_mappings IS 'Playbook-to-knowledge mapping system. Defines how playbook implementations should update and enhance the company knowledge base with new insights and information.';

-- Knowledge Update Triggers - Automated knowledge base updates
COMMENT ON TABLE knowledge_update_triggers IS 'Automated knowledge base update triggers. Manages automatic updates to the knowledge base based on playbook progress, user responses, and business insights.';

-- Monitoring Alerts - System monitoring and alerting
COMMENT ON TABLE monitoring_alerts IS 'System monitoring and alerting for business processes. Tracks thresholds, milestones, and anomalies in business operations with automated alerting and resolution tracking.';

-- Journey Playbook Mapping - Backward compatibility mapping
COMMENT ON TABLE journey_playbook_mapping IS 'Backward compatibility mapping between journey templates and playbook templates. Maintains compatibility during system evolution and migration.';

-- ============================================================================
-- INTEGRATION & CONNECTIVITY
-- ============================================================================

-- Integrations - Available integration definitions
COMMENT ON TABLE integrations IS 'Integration catalog and definitions. Defines available third-party integrations, their configuration schemas, and capabilities for connecting external systems to Nexus.';

-- User Integrations - User-specific integration instances
COMMENT ON TABLE user_integrations IS 'User-specific integration instances and configurations. Manages individual user connections to external services with credentials, settings, and status tracking.';

-- OAuth States - OAuth flow state management
COMMENT ON TABLE oauth_states IS 'OAuth authentication flow state management. Tracks OAuth authorization flows for secure integration setup and user authentication with external services.';

-- OAuth Tokens - OAuth token storage and management
COMMENT ON TABLE oauth_tokens IS 'OAuth token storage and management. Securely stores access and refresh tokens for user integrations with external services and APIs.';

-- ============================================================================
-- BUSINESS DATA & CRM
-- ============================================================================

-- Contacts - Business contact management
COMMENT ON TABLE contacts IS 'Business contact management system. Stores customer, prospect, and partner contact information with relationship tracking and communication history.';

-- Deals - Sales opportunity and deal tracking
COMMENT ON TABLE deals IS 'Sales opportunity and deal management. Tracks sales pipeline, deal stages, probability, and revenue forecasting for business development and sales management.';

-- Personal Thoughts - User personal notes and ideas
COMMENT ON TABLE personal_thoughts IS 'Personal notes and idea management. Allows users to capture thoughts, ideas, and insights with tagging and metadata for personal knowledge management.';

-- ============================================================================
-- SYSTEM & INFRASTRUCTURE
-- ============================================================================

-- Brain Tickets - System support and issue tracking
COMMENT ON TABLE brain_tickets IS 'System support and issue tracking. Manages user support requests, system issues, and feature requests with organization-based routing and resolution tracking.';

-- Schema Migrations - Database migration tracking
COMMENT ON TABLE schema_migrations IS 'Database schema migration tracking. Records applied migrations, execution times, and checksums for database version control and deployment management.';

-- ============================================================================
-- COLUMN-LEVEL COMMENTS FOR KEY TABLES
-- ============================================================================

-- Organizations table columns - External business relationships
COMMENT ON COLUMN organizations.slug IS 'URL-friendly organization identifier for external business relationships';
COMMENT ON COLUMN organizations.type IS 'Organization type: internal (Nexus team), external (business partner), client (paying customer), partner (business partner)';
COMMENT ON COLUMN organizations.industry IS 'External organization industry for relationship context and CRM';
COMMENT ON COLUMN organizations.size IS 'External organization size for relationship scaling and business development';
COMMENT ON COLUMN organizations.revenue_range IS 'External organization revenue for business relationship context';

-- User Profiles table columns - User identity with company context
COMMENT ON COLUMN user_profiles.user_id IS 'Authentik user identifier - primary key for user identity management';
COMMENT ON COLUMN user_profiles.role IS 'User role within their internal company (owner, admin, manager, user)';
COMMENT ON COLUMN user_profiles.company_id IS 'Internal company association for billing, permissions, and business operations';
COMMENT ON COLUMN user_profiles.organization_id IS 'Primary external organization association for business relationships';
COMMENT ON COLUMN user_profiles.business_type IS 'Type of business for domain-specific recommendations and billing';
COMMENT ON COLUMN user_profiles.funding_stage IS 'Business funding stage for appropriate growth recommendations and billing tiers';

-- AI Conversations table columns
COMMENT ON COLUMN ai_conversations.user_id IS 'Authentik user identifier for conversation ownership';
COMMENT ON COLUMN ai_conversations.messages IS 'JSON array of conversation messages with metadata';
COMMENT ON COLUMN ai_conversations.total_tokens IS 'Total token usage for cost tracking and rate limiting';
COMMENT ON COLUMN ai_conversations.total_cost IS 'Total cost of conversation for billing and usage analytics';
COMMENT ON COLUMN ai_conversations.context IS 'Conversation context and domain information for AI expert routing';

-- Building Blocks table columns
COMMENT ON COLUMN building_blocks.category IS 'Building block category aligned with 7 Nexus domains';
COMMENT ON COLUMN building_blocks.complexity IS 'Implementation complexity: simple, medium, or complex';
COMMENT ON COLUMN building_blocks.risk_level IS 'Implementation risk assessment for decision making';
COMMENT ON COLUMN building_blocks.expected_impact IS 'Expected business impact level for prioritization';
COMMENT ON COLUMN building_blocks.phase_relevance IS 'FIRE cycle phases where this building block is most relevant';

-- Playbook Templates table columns
COMMENT ON COLUMN playbook_templates.category IS 'Playbook category for domain-specific organization';
COMMENT ON COLUMN playbook_templates.estimated_duration_hours IS 'Expected time to complete playbook for planning';
COMMENT ON COLUMN playbook_templates.complexity IS 'Playbook complexity level for user guidance';
COMMENT ON COLUMN playbook_templates.prerequisites IS 'Required prerequisites and dependencies for playbook execution';

-- CKB Documents table columns
COMMENT ON COLUMN ckb_documents.embedding_vector IS 'Vector embedding for semantic search and AI-powered knowledge retrieval';
COMMENT ON COLUMN ckb_documents.source IS 'Document source: upload, onedrive, gdrive, or manual entry';
COMMENT ON COLUMN ckb_documents.metadata IS 'Document metadata including tags, categories, and processing information';

-- Companies table columns - Internal business operations
COMMENT ON COLUMN companies.owner_id IS 'Authentik user ID of the company owner - primary administrator';
COMMENT ON COLUMN companies.subscription_plan IS 'Billing subscription plan (free, basic, pro, enterprise) for feature access control';
COMMENT ON COLUMN companies.max_users IS 'Active user limit for billing and seat management';
COMMENT ON COLUMN companies.billing_info IS 'Billing information including payment methods, billing cycles, and financial data';
COMMENT ON COLUMN companies.tax_info IS 'Tax information for billing and compliance';
COMMENT ON COLUMN companies.settings IS 'Company-wide settings and feature flags for permissions and access control';
COMMENT ON COLUMN companies.is_active IS 'Company status for billing and subscription management';

-- Business Health Snapshots table columns
COMMENT ON COLUMN business_health_snapshots.overall_score IS 'Overall business health score across all 7 domains';
COMMENT ON COLUMN business_health_snapshots.category_scores IS 'Individual category scores for detailed analysis';
COMMENT ON COLUMN business_health_snapshots.data_quality_score IS 'Data quality assessment for health calculations';
COMMENT ON COLUMN business_health_snapshots.completion_percentage IS 'Profile completion percentage for health assessment';

-- AI Experts table columns
COMMENT ON COLUMN ai_experts.expert_id IS 'Unique expert identifier for AI routing and selection';
COMMENT ON COLUMN ai_experts.focus_area IS 'Primary business domain expertise area';
COMMENT ON COLUMN ai_experts.building_block_categories IS 'Building block categories this expert specializes in';
COMMENT ON COLUMN ai_experts.keywords IS 'Keywords that trigger expert selection for user queries';

-- ============================================================================
-- MIGRATION COMPLETION
-- ============================================================================

-- Log the completion of this migration
INSERT INTO schema_migrations (version, name, applied_at) 
VALUES ('103', 'add_table_descriptions', NOW())
ON CONFLICT (version) DO NOTHING;
