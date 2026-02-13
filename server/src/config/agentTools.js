/**
 * Agent Tools Configuration
 *
 * This file centralizes the tool definitions available to Nexus agents.
 * Tools are split into three categories:
 *
 *   TOOLS_OPENCLAW_CORE — Built-in OpenClaw tools (exec, read, write, edit, browser,
 *       sessions, skills). OpenClaw handles these natively via its agent runtime.
 *       Aligned with https://docs.openclaw.ai tool documentation.
 *
 *   TOOLS_OPENCLAW_SKILLS — Higher-level capabilities provided by OpenClaw's skill
 *       system (web search, scraping, strategy, etc.). These are loaded from SKILL.md
 *       files and may vary by workspace.
 *
 *   TOOLS_NEXUS_BRIDGED — Tools that require Nexus-side resources (database,
 *       OAuth tokens, user context). Nexus executes these server-side via the
 *       tool bridge at /api/openclaw/tools/execute.
 */

// Core OpenClaw tools — always available in the agent runtime
const TOOLS_OPENCLAW_CORE = [
    { id: 'exec', name: 'Shell Exec', description: 'Execute shell commands — git clone/commit/push, npm/pip install, run scripts, manage processes, and perform any system operation in the workspace', provider: 'openclaw' },
    { id: 'read', name: 'Read File', description: 'Read file contents from the workspace', provider: 'openclaw' },
    { id: 'write', name: 'Write File', description: 'Create or overwrite files in the workspace', provider: 'openclaw' },
    { id: 'edit', name: 'Edit File', description: 'Make targeted edits to existing files without rewriting the entire file', provider: 'openclaw' },
    { id: 'apply_patch', name: 'Apply Patch', description: 'Apply structured multi-file edits in a single operation', provider: 'openclaw' },
    { id: 'browser', name: 'Browser', description: 'Browse web pages, extract content, and interact with websites', provider: 'openclaw' },
    { id: 'sessions_list', name: 'List Sessions', description: 'List active sessions with filtering by kind, recency, and message count', provider: 'openclaw' },
    { id: 'sessions_history', name: 'Session History', description: 'Fetch the conversation transcript for a specific session', provider: 'openclaw' },
    { id: 'sessions_send', name: 'Send to Session', description: 'Send a message to another session (fire-and-forget or synchronous)', provider: 'openclaw' },
    { id: 'sessions_spawn', name: 'Spawn Sub-Agent', description: 'Start an isolated sub-agent session to handle a delegated task', provider: 'openclaw' },
];

// OpenClaw skill-based tools — loaded from SKILL.md files, may vary by workspace
const TOOLS_OPENCLAW_SKILLS = [
    { id: 'web_search', name: 'Web Search', description: 'Query the live internet for facts, research, and up-to-date information', provider: 'openclaw' },
    { id: 'advanced_scrape', name: 'Advanced Scrape', description: 'Deeply extract and parse data from specific URLs and web pages', provider: 'openclaw' },
    { id: 'summarize_strategy', name: 'Summarize Strategy', description: 'Synthesize complex information into high-level strategy and actionable plans', provider: 'openclaw' },
    { id: 'create_skill', name: 'Create Skill', description: 'Generate, write, and test new automated capabilities and scripts', provider: 'openclaw' },
    { id: 'list_skills', name: 'List Skills', description: 'Browse the current library of automated skills', provider: 'openclaw' },
    { id: 'search_skills', name: 'Search Skills', description: 'Find specific skills for a task', provider: 'openclaw' },
    { id: 'install_skill', name: 'Install Skill', description: 'Add new skills from external registries (ClawHub)', provider: 'openclaw' },
];

// Combined OpenClaw tools (core + skills)
const TOOLS_OPENCLAW_NATIVE = [...TOOLS_OPENCLAW_CORE, ...TOOLS_OPENCLAW_SKILLS];

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
