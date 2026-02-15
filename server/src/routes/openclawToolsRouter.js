const express = require('express');
const router = express.Router();
const emailService = require('../services/emailService'); // Import the email service
const { logger } = require('../utils/logger'); // Assuming logger utility

const openClawToolConfig = {
    nexus_send_email: { name: 'nexus_send_email', handler: emailService.sendEmail },
    // Add other nexus_ tool handlers here
    // nexus_forward_email: { name: 'nexus_forward_email', handler: emailService.forwardEmail },
    // nexus_add_shared_mailbox: { name: 'nexus_add_shared_mailbox', handler: emailService.addSharedMailbox },
};

router.post('/tools/execute', async (req, res) => {
    // IMPORTANT: Ensure userId is securely obtained from your authenticated request context.
    // Here, we assume the userId is available via req.user.id from an auth middleware,
    // or passed in req.body for OpenClaw's internal tool calls.
    const userId = req.user?.id || req.body.userId; 

    if (!userId) {
        logger.error('Authentication required: User ID missing for tool execution.', { endpoint: req.path, method: req.method });
        return res.status(401).json({ success: false, error: 'Authentication required: User ID missing for tool execution.' });
    }

    const { toolName, args } = req.body;

    if (!toolName) {
        logger.error('Tool name is required for tool execution.', { userId });
        return res.status(400).json({ success: false, error: 'Tool name is required.' });
    }

    const tool = openClawToolConfig[toolName];
    if (!tool) {
        logger.error(`Unknown tool requested: ${toolName}`, { userId });
        return res.status(404).json({ success: false, error: `Unknown tool: ${toolName}` });
    }

    // Log the tool execution request
    logger.info(`Executing OpenClaw tool: ${toolName} for user: ${userId}`, { args });

    try {
        let result = await tool.handler(args, userId); // Pass args and userId to the tool handler
        logger.info(`Tool ${toolName} executed successfully for user ${userId}.`, { result });
        res.json({ success: true, result });
    } catch (error) {
        logger.error(`Error executing tool ${toolName} for user ${userId}:`, { error: error.message, stack: error.stack });
        res.status(500).json({ success: false, error: error.message, stack: process.env.NODE_ENV === 'development' ? error.stack : undefined });
    }
});

module.exports = router;
