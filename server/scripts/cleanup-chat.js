const { query } = require('../src/database/connection');
const { logger } = require('../src/utils/logger');

/**
 * Chat Cleanup Script
 * 
 * Goals:
 * 1. Deduplicate messages with identical content/role/conversation within a short window.
 * 2. Delete strictly empty conversations.
 * 3. Archive long-inactive "New Conversation" threads.
 */
async function cleanupChat() {
    logger.info('Starting Chat Database Hygiene...');

    try {
        // 1. Deduplicate messages
        // Identifies messages with same conv, role, and content created within 2 seconds of each other
        const dedupeResult = await query(`
            DELETE FROM ai_messages
            WHERE id IN (
                SELECT id
                FROM (
                    SELECT id,
                           ROW_NUMBER() OVER (
                               PARTITION BY conversation_id, role, content 
                               ORDER BY created_at ASC
                           ) as row_num
                    FROM ai_messages
                    WHERE created_at > NOW() - INTERVAL '7 days'
                ) t
                WHERE t.row_num > 1
            )
        `);
        logger.info('Deduplication complete', { deletedCount: dedupeResult.data?.rowCount || 0 });

        // 2. Delete empty conversations (no messages associated)
        const deleteEmptyResult = await query(`
            DELETE FROM ai_conversations
            WHERE id NOT IN (SELECT DISTINCT conversation_id FROM ai_messages)
            AND created_at < NOW() - INTERVAL '1 hour'
        `);
        logger.info('Deleted empty conversations', { count: deleteEmptyResult.data?.rowCount || 0 });

        // 3. Archive inactive "New Conversation" threads
        const archiveInactiveResult = await query(`
            UPDATE ai_conversations
            SET is_archived = true
            WHERE (title = 'New Conversation' OR title = 'Untitled Conversation')
            AND id IN (
                SELECT conversation_id 
                FROM ai_messages 
                GROUP BY conversation_id 
                HAVING COUNT(*) <= 2
            )
            AND updated_at < NOW() - INTERVAL '24 hours'
            AND is_archived = false
        `);
        logger.info('Archived inactive low-value threads', { count: archiveInactiveResult.data?.rowCount || 0 });

        logger.info('Chat Database Hygiene COMPLETED.');
    } catch (error) {
        logger.error('Chat hygiene failed', { error });
    }
}

// Run if called directly
if (require.main === module) {
    cleanupChat().then(() => process.exit(0));
}

module.exports = { cleanupChat };
