/**
 * Tool Activity Bridge
 *
 * A lightweight in-memory event bus that forwards OpenClaw tool execution events
 * (from /api/openclaw/tools/execute) into the active SSE chat stream (from /api/ai/chat).
 *
 * This allows the Activity Timeline in the UI to show real-time tool call activity
 * (e.g. "Calling nexus_search_emails") instead of generic "Agent is still working" messages.
 *
 * Usage:
 *   - ai.js registers the SSE response when streaming starts:
 *       toolActivityBridge.register(userId, res, writeSseEvent, buildStreamStatus)
 *   - ai.js unregisters when streaming ends:
 *       toolActivityBridge.unregister(userId)
 *   - openclaw-integration.js emits events when a tool is called or fails:
 *       toolActivityBridge.emitToolStart(userId, toolName)
 *       toolActivityBridge.emitToolResult(userId, toolName, success, error?)
 */

const EventEmitter = require('events');

class ToolActivityBridge extends EventEmitter {
    constructor() {
        super();
        /** @type {Map<string, { res: object, writeSseEvent: Function, buildStreamStatus: Function }>} */
        this._streams = new Map();
    }

    /**
     * Register an active SSE stream for a user.
     * @param {string} userId
     * @param {object} res - Express response object
     * @param {Function} writeSseEvent
     * @param {Function} buildStreamStatus
     */
    register(userId, res, writeSseEvent, buildStreamStatus) {
        this._streams.set(userId, { res, writeSseEvent, buildStreamStatus });
    }

    /**
     * Unregister when the SSE stream ends.
     * @param {string} userId
     */
    unregister(userId) {
        this._streams.delete(userId);
    }

    /**
     * Emit a "tool is starting" event into the user's active SSE stream.
     * @param {string} userId
     * @param {string} toolName
     */
    emitToolStart(userId, toolName) {
        const stream = this._streams.get(userId);
        if (!stream || stream.res.writableEnded) return;

        const humanName = this._humanizeToolName(toolName);
        try {
            stream.writeSseEvent(
                stream.res,
                stream.buildStreamStatus('tool_execution', `Executing: ${humanName}`, `Tool ${toolName} called by agent`)
            );
        } catch { /* stream may have closed */ }
    }

    /**
     * Emit a "tool completed" or "tool failed" event.
     * @param {string} userId
     * @param {string} toolName
     * @param {boolean} success
     * @param {string} [error]
     */
    emitToolResult(userId, toolName, success, error) {
        const stream = this._streams.get(userId);
        if (!stream || stream.res.writableEnded) return;

        const humanName = this._humanizeToolName(toolName);
        try {
            if (success) {
                stream.writeSseEvent(
                    stream.res,
                    stream.buildStreamStatus('tool_execution', `${humanName} completed`, null)
                );
            } else {
                stream.writeSseEvent(
                    stream.res,
                    stream.buildStreamStatus('tool_execution', `${humanName} failed`, error || 'Unknown error')
                );
            }
        } catch { /* stream may have closed */ }
    }

    /**
     * Convert tool IDs to human-readable names.
     * @param {string} toolName
     * @returns {string}
     */
    _humanizeToolName(toolName) {
        const map = {
            nexus_get_integration_status: 'Check integrations',
            nexus_search_emails: 'Search emails',
            nexus_send_email: 'Send email',
            nexus_get_calendar_events: 'Check calendar',
            nexus_resolve_email_provider: 'Detect email provider',
            nexus_start_email_connection: 'Connect email',
            nexus_connect_imap: 'Connect IMAP',
            nexus_test_integration_connection: 'Test connection',
            nexus_disconnect_integration: 'Disconnect integration'
        };
        return map[toolName] || toolName.replace(/^nexus_/, '').replace(/_/g, ' ');
    }
}

// Singleton instance
const toolActivityBridge = new ToolActivityBridge();

module.exports = { toolActivityBridge };
