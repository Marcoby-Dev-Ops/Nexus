const { query } = require('../src/database/connection');
const { logger } = require('../src/utils/logger');
const { NexusAIGatewayService } = require('../services/NexusAIGatewayService');

/**
 * Advanced Chat Hygiene Script
 * 
 * Phase 1: Pruning - Delete short, inactive threads (<= 2 messages, older than 24h).
 * Phase 2: AI Titling - Summarize substantive threads currently named "New Conversation".
 */

const DRY_RUN = process.argv.includes('--dry-run');

async function runHygiene() {
    logger.info(`Starting Advanced Chat Hygiene ${DRY_RUN ? '(DRY RUN)' : ''}...`);

    const aiGateway = new NexusAIGatewayService();

    try {
        // --- Phase 1: Pruning ---
        logger.info('Phase 1: Pruning short/inactive threads...');

        const shortThreadsQuery = `
            SELECT id, title FROM ai_conversations
            WHERE (
                -- Strictly empty threads (0 messages) can be pruned immediately if over 1 hour old
                (id NOT IN (SELECT DISTINCT conversation_id FROM ai_messages) AND created_at < NOW() - INTERVAL '1 hour')
                OR 
                -- Short abandoned threads (1-2 messages) older than 24h
                (id IN (SELECT conversation_id FROM ai_messages GROUP BY conversation_id HAVING COUNT(*) <= 2) AND updated_at < NOW() - INTERVAL '24 hours')
            )
            AND is_archived = false
        `;

        const { data: shortThreads } = await query(shortThreadsQuery);
        logger.info(`Found ${shortThreads.length} short/inactive threads to prune.`);

        if (!DRY_RUN && shortThreads.length > 0) {
            const idsToDelete = shortThreads.map(t => t.id);
            // Delete messages first due to FK
            await query('DELETE FROM ai_messages WHERE conversation_id = ANY($1)', [idsToDelete]);
            const deleteResult = await query('DELETE FROM ai_conversations WHERE id = ANY($1)', [idsToDelete]);
            logger.info(`Pruned ${deleteResult.data?.rowCount || 0} threads.`);
        } else if (shortThreads.length > 0) {
            logger.info('[DRY RUN] Would have deleted the following threads:', shortThreads.map(t => `${t.id} ("${t.title}")`));
        }

        // --- Phase 2: AI Titling ---
        logger.info('Phase 2: AI Titling for substantive threads...');

        const genericTitles = [
            'New Conversation', 'Untitled Conversation', '',
            'Yo', 'Hello', 'Hi', 'Hey', 'hello', 'hi', 'hey', 'yo'
        ];
        const genericThreadsQuery = `
            SELECT c.id, c.title, 
                   (SELECT json_agg(m.content ORDER BY m.created_at ASC) 
                    FROM (SELECT content, created_at FROM ai_messages WHERE conversation_id = c.id LIMIT 3) m) as first_messages
            FROM ai_conversations c
            WHERE (c.title IS NULL OR c.title = ANY($1))
            AND c.id IN (
                SELECT conversation_id 
                FROM ai_messages 
                GROUP BY conversation_id 
                HAVING COUNT(*) >= 1
            )
            AND c.is_archived = false
        `;

        const { data: genericThreads } = await query(genericThreadsQuery, [genericTitles]);
        logger.info(`Found ${genericThreads.length} threads needing better titles.`);

        const BATCH_SIZE = 5;
        let updatedCount = 0;

        for (let i = 0; i < genericThreads.length; i += BATCH_SIZE) {
            const batch = genericThreads.slice(i, i + BATCH_SIZE);

            await Promise.all(batch.map(async (thread) => {
                try {
                    const messages = thread.first_messages || [];
                    if (messages.length === 0) return;

                    const contentToSummarize = messages.join('\n').substring(0, 1000);

                    const response = await aiGateway.chat({
                        messages: [
                            { role: 'system', content: 'You are a helpful assistant that generates extremely concise titles (3-5 words) for chat conversations.' },
                            { role: 'user', content: `Generate a 3-5 word title for a conversation that starts with these messages. Return ONLY the title text, no quotes or intro:\n\n${contentToSummarize}` }
                        ],
                        role: 'chat',
                        sensitivity: 'internal',
                        tenantId: 'nexus-hygiene'
                    });

                    if (response.success && response.data?.message) {
                        const newTitle = response.data.message.trim().replace(/^["']|["']$/g, '');

                        if (!DRY_RUN) {
                            await query('UPDATE ai_conversations SET title = $1 WHERE id = $2', [newTitle, thread.id]);
                            logger.info(`Updated thread ${thread.id}: "${thread.title}" -> "${newTitle}"`);
                        } else {
                            logger.info(`[DRY RUN] Would update thread ${thread.id}: "${thread.title}" -> "${newTitle}"`);
                        }
                        updatedCount++;
                    } else {
                        logger.warn(`Failed to generate title for ${thread.id}: ${response.error || 'No content'}`);
                    }
                } catch (err) {
                    logger.error(`Error processing thread ${thread.id}:`, err);
                }
            }));
        }

        logger.info(`Advanced Chat Hygiene COMPLETE. ${updatedCount} titles processed.`);
    } catch (error) {
        logger.error('Hygiene script failed:', error);
    } finally {
        process.exit(0);
    }
}

if (require.main === module) {
    runHygiene();
}

module.exports = { runHygiene };
