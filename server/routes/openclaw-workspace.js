const express = require('express');
const router = express.Router();
const { logger } = require('../src/utils/logger.js');
const { getAgentRuntime } = require('../src/services/agentRuntime');

// Middleware to get current runtime
const withRuntime = (req, res, next) => {
    try {
        req.runtime = getAgentRuntime();
        next();
    } catch (error) {
        logger.error('Failed to get agent runtime:', error);
        res.status(503).json({
            success: false,
            error: 'Agent runtime unavailable',
            code: 'SERVICE_UNAVAILABLE'
        });
    }
};

/**
 * GET /api/openclaw/workspace/files
 * List all files in the OpenClaw workspace
 */
router.get('/files', withRuntime, async (req, res) => {
    try {
        const { query } = req;

        // Check if runtime supports file listing
        if (typeof req.runtime.listWorkspaceFiles !== 'function') {
            return res.status(501).json({
                success: false,
                error: 'Workspace file listing not supported by current runtime',
                code: 'NOT_IMPLEMENTED'
            });
        }

        const result = await req.runtime.listWorkspaceFiles({ query });

        // Normalize result to ensure it's a list
        const files = Array.isArray(result) ? result : (result.files || []);

        return res.json({
            success: true,
            data: files,
            count: files.length
        });
    } catch (error) {
        logger.error('Failed to list workspace files:', error);

        return res.status(500).json({
            success: false,
            error: error.message || 'Failed to list workspace files',
            code: 'INTERNAL_ERROR'
        });
    }
});

/**
 * GET /api/openclaw/workspace/files/:filename
 * Download or view a specific file
 */
router.get('/files/:filename', withRuntime, async (req, res) => {
    try {
        const { filename } = req.params;

        if (!filename) {
            return res.status(400).json({
                success: false,
                error: 'Filename is required',
                code: 'VALIDATION_ERROR'
            });
        }

        // Check if runtime supports file retrieval
        if (typeof req.runtime.getWorkspaceFile !== 'function') {
            return res.status(501).json({
                success: false,
                error: 'File retrieval not supported by current runtime',
                code: 'NOT_IMPLEMENTED'
            });
        }

        const response = await req.runtime.getWorkspaceFile(filename, {
            timeoutMs: 30000 // Higher timeout for downloads
        });

        // Pipe the response to the client
        // Copy headers from response if needed (ContentType, ContentLength, etc.)
        const contentType = response.headers.get('content-type');
        if (contentType) res.setHeader('Content-Type', contentType);

        const contentLength = response.headers.get('content-length');
        if (contentLength) res.setHeader('Content-Length', contentLength);

        // Set disposition if it's a download
        if (req.query.download === 'true') {
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        }

        // Convert web stream to node stream or buffer
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        res.send(buffer);

    } catch (error) {
        logger.error(`Failed to get workspace file "${req.params.filename}":`, error);

        const status = error.message.includes('404') || error.message.includes('File not found') ? 404 : 500;

        return res.status(status).json({
            success: false,
            error: error.message || 'Failed to retrieve file',
            code: status === 404 ? 'NOT_FOUND' : 'INTERNAL_ERROR'
        });
    }
});

const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

/**
 * POST /api/openclaw/workspace/files
 * Upload a file to the workspace
 */
router.post('/files', withRuntime, upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: 'No file provided',
                code: 'VALIDATION_ERROR'
            });
        }

        // Check if runtime supports upload
        if (typeof req.runtime.uploadWorkspaceFile !== 'function') {
            return res.status(501).json({
                success: false,
                error: 'File upload not supported by current runtime',
                code: 'NOT_IMPLEMENTED'
            });
        }

        const result = await req.runtime.uploadWorkspaceFile(req.file);

        return res.json({
            success: true,
            data: result
        });

    } catch (error) {
        logger.error('Failed to upload workspace file:', error);

        return res.status(500).json({
            success: false,
            error: error.message || 'Failed to upload file',
            code: 'INTERNAL_ERROR'
        });
    }
});

module.exports = router;
