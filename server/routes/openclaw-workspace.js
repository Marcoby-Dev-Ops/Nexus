/**
 * Workspace Files API
 *
 * Nexus-native file storage endpoints.
 * Replaces the former OpenClaw workspace proxy with direct filesystem access.
 *
 * Routes:
 *   GET    /api/workspace/files              — list user's files
 *   GET    /api/workspace/files/:filename    — download/view a file
 *   POST   /api/workspace/files              — upload a file
 *   DELETE /api/workspace/files/:filename    — delete a file
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const { authenticateToken } = require('../src/middleware/auth');
const { logger } = require('../src/utils/logger.js');
const workspaceFileService = require('../src/services/workspaceFileService');

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: workspaceFileService.MAX_FILE_SIZE }
});

/**
 * GET /api/workspace/files
 * List all files in the authenticated user's workspace.
 */
router.get('/files', authenticateToken, async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

        const files = await workspaceFileService.listFiles();

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
 * GET /api/workspace/files/:filename
 * Download or view a specific workspace file.
 */
router.get('/files/:filename', authenticateToken, async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

        const { filename } = req.params;
        const { buffer, mimeType, size } = await workspaceFileService.readFile(filename);

        res.setHeader('Content-Type', mimeType);
        res.setHeader('Content-Length', size);

        if (req.query.download === 'true') {
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        }

        return res.send(buffer);
    } catch (error) {
        const status = error.code === 'NOT_FOUND' ? 404 : 500;
        logger.error(`Failed to get workspace file "${req.params.filename}":`, error);
        return res.status(status).json({
            success: false,
            error: error.message || 'Failed to retrieve file',
            code: status === 404 ? 'NOT_FOUND' : 'INTERNAL_ERROR'
        });
    }
});

/**
 * POST /api/workspace/files
 * Upload a file to the user's workspace.
 */
router.post('/files', authenticateToken, upload.single('file'), async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: 'No file provided',
                code: 'VALIDATION_ERROR'
            });
        }

        const result = await workspaceFileService.writeFile(
            req.file.originalname,
            req.file.buffer,
            { mimeType: req.file.mimetype, source: 'user' }
        );

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

/**
 * DELETE /api/workspace/files/:filename
 * Delete a file from the user's workspace.
 */
router.delete('/files/:filename', authenticateToken, async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

        const { filename } = req.params;
        await workspaceFileService.deleteFile(filename);

        return res.json({
            success: true,
            message: `File "${filename}" deleted successfully`
        });
    } catch (error) {
        const status = error.code === 'NOT_FOUND' ? 404 : 500;
        logger.error(`Failed to delete workspace file "${req.params.filename}":`, error);
        return res.status(status).json({
            success: false,
            error: error.message || 'Failed to delete file',
            code: status === 404 ? 'NOT_FOUND' : 'INTERNAL_ERROR'
        });
    }
});

module.exports = router;
