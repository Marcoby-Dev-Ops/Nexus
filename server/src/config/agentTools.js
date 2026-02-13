/**
 * Agent Tools Configuration
 *
 * This file centralizes the tool definitions available to Nexus agents.
 * Tools are split into two categories:
 *
 *   TOOLS_OPENCLAW_NATIVE — Capabilities provided by OpenClaw's own plugin system
 *       (web search, skill management, code execution, etc.).
 *       Nexus does NOT execute these; OpenClaw handles them natively.
 *       Listed here for UI display, documentation, and assistantCore snapshot.
 *
 *   TOOLS_NEXUS_BRIDGED — Tools that require Nexus-side resources (database,
 *       OAuth tokens, user context). Nexus executes these server-side via the
 *       tool bridge at /api/openclaw/tools/execute.
 */

const TOOLS_OPENCLAW_NATIVE = [
    { id: 'web_search', name: 'Web Search', description: 'Query the live internet for facts, research, and up-to-date information', provider: 'openclaw' },
    { id: 'advanced_scrape', name: 'Advanced Scrape', description: 'Deeply extract and parse data from specific URLs and web pages', provider: 'openclaw' },
    { id: 'summarize_strategy', name: 'Summarize Strategy', description: 'Synthesize complex information into high-level strategy and actionable plans', provider: 'openclaw' },
    { id: 'create_skill', name: 'Create Skill', description: 'Generate, write, and test new automated capabilities and scripts', provider: 'openclaw' },
    { id: 'implement_action', name: 'Implement Action', description: 'Execute shell commands, run code, manage files and directories, use git (clone, commit, push), install packages, and perform system operations', provider: 'openclaw' },
    { id: 'file_operations', name: 'File Operations', description: 'Read, write, create, edit, and delete files and directories in the workspace', provider: 'openclaw' },
    { id: 'code_execution', name: 'Code Execution', description: 'Run scripts and code in multiple languages (Python, Node.js, bash, etc.) with full output capture', provider: 'openclaw' },
    { id: 'list_skills', name: 'List Skills', description: 'Browse the current library of automated skills', provider: 'openclaw' },
    { id: 'search_skills', name: 'Search Skills', description: 'Find specific skills for a task', provider: 'openclaw' },
    { id: 'install_skill', name: 'Install Skill', description: 'Add new skills from external registries (ClawHub)', provider: 'openclaw' }
];

const TOOLS_NEXUS_BRIDGED = [
    { id: 'nexus_get_integration_status', name: 'Hub Health', description: 'Check status of connected business integrations' },
    { id: 'nexus_search_emails', name: 'Email Search', description: 'Search and read across connected email accounts' },
    { id: 'nexus_send_email', name: 'Email Sender', description: 'Draft and send emails via connected accounts' },
    { id: 'nexus_get_calendar_events', name: 'Calendar Events', description: 'Retrieve upcoming events from your calendar' },
    { id: 'nexus_resolve_email_provider', name: 'Email Resolver', description: 'Identify technical provider for an address' },
    { id: 'nexus_start_email_connection', name: 'Email Linker', description: 'Connect a new email account via OAuth' },
    { id: 'nexus_connect_imap', name: 'IMAP Connector', description: 'Manual connection for custom email servers' },
    { id: 'nexus_test_integration_connection', name: 'Integration Test', description: 'Validate integration stability' },
    { id: 'nexus_disconnect_integration', name: 'Disconnect Integration', description: 'Safely remove a connected tool' }
];

const ENABLE_NEXUS_INTEGRATION_TOOLS = process.env.OPENCLAW_ENABLE_NEXUS_INTEGRATION_TOOLS !== 'false';

// Full catalog for UI display and assistantCore snapshot (both categories)
const ALL_TOOLS = ENABLE_NEXUS_INTEGRATION_TOOLS
    ? [...TOOLS_OPENCLAW_NATIVE, ...TOOLS_NEXUS_BRIDGED]
    : TOOLS_OPENCLAW_NATIVE;

// Backward-compatible aliases
const TOOLS_BASE = TOOLS_OPENCLAW_NATIVE;
const TOOLS_NEXUS_INTEGRATIONS = TOOLS_NEXUS_BRIDGED;
const DEFAULT_TOOLS = ALL_TOOLS;

module.exports = {
    TOOLS_OPENCLAW_NATIVE,
    TOOLS_NEXUS_BRIDGED,
    ALL_TOOLS,
    // Backward-compatible exports
    TOOLS_BASE,
    TOOLS_NEXUS_INTEGRATIONS,
    DEFAULT_TOOLS,
    ENABLE_NEXUS_INTEGRATION_TOOLS
};
