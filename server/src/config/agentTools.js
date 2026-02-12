/**
 * Agent Tools Configuration
 * 
 * This file centralizes the tool definitions available to Nexus agents.
 * Tools are categorized by their functionality.
 */

const TOOLS_BASE = [
    { id: 'web_search', name: 'Web Search', description: 'Query the live internet for facts and research' },
    { id: 'advanced_scrape', name: 'Advanced Scrape', description: 'Deeply extract data from specific URLs' },
    { id: 'summarize_strategy', name: 'Summarize Strategy', description: 'Synthesize complex information into high-level strategy' },
    { id: 'create_skill', name: 'Create Skill', description: 'Generate and test new automated capabilities' },
    { id: 'implement_action', name: 'Implement Action', description: 'Execute specific system commands or code' },
    { id: 'list_skills', name: 'List Skills', description: 'Browse the current library of automated skills' },
    { id: 'search_skills', name: 'Search Skills', description: 'Find specific skills for a task' },
    { id: 'install_skill', name: 'Install Skill', description: 'Add new skills from external registries (ClawHub)' }
];

const TOOLS_NEXUS_INTEGRATIONS = [
    { id: 'nexus_get_integration_status', name: 'Hub Health', description: 'Check status of connected business integrations' },
    { id: 'nexus_search_emails', name: 'Email Search', description: 'Search and read across connected email accounts' },
    { id: 'nexus_resolve_email_provider', name: 'Email Resolver', description: 'Identify technical provider for an address' },
    { id: 'nexus_start_email_connection', name: 'Email Linker', description: 'Connect a new email account via OAuth' },
    { id: 'nexus_connect_imap', name: 'IMAP Connector', description: 'Manual connection for custom email servers' },
    { id: 'nexus_test_integration_connection', name: 'Integration Test', description: 'Validate integration stability' },
    { id: 'nexus_disconnect_integration', name: 'Disconnect Integration', description: 'Safely remove a connected tool' }
];

const ENABLE_NEXUS_INTEGRATION_TOOLS = process.env.OPENCLAW_ENABLE_NEXUS_INTEGRATION_TOOLS !== 'false';

const DEFAULT_TOOLS = ENABLE_NEXUS_INTEGRATION_TOOLS
    ? [...TOOLS_BASE, ...TOOLS_NEXUS_INTEGRATIONS]
    : TOOLS_BASE;

module.exports = {
    TOOLS_BASE,
    TOOLS_NEXUS_INTEGRATIONS,
    DEFAULT_TOOLS,
    ENABLE_NEXUS_INTEGRATION_TOOLS
};
