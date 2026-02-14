/**
 * Workspace File Service
 *
 * Nexus-native file service for 2-way file exchange between users and the AI agent.
 * Files are stored in a single instance-level workspace directory.
 * Segmentation happens at the instance/silo level — logging in means you're in your workspace.
 *
 * Security:
 *   - Path traversal protection (no ../, no absolute paths in filenames)
 *   - File size limit (configurable via WORKSPACE_MAX_FILE_SIZE, default 50MB)
 */

const fs = require('fs');
const path = require('path');
const { logger } = require('../utils/logger');

const WORKSPACE_ROOT = process.env.WORKSPACE_DIR || '/data/workspace';
const MAX_FILE_SIZE = parseInt(process.env.WORKSPACE_MAX_FILE_SIZE || '52428800', 10); // 50MB

/**
 * Validate a filename to prevent path traversal attacks.
 * @param {string} filename
 * @returns {string} sanitized filename
 * @throws if the filename is invalid
 */
function sanitizeFilename(filename) {
    const trimmed = String(filename || '').trim();
    if (!trimmed) throw new Error('Filename is required');
    if (trimmed.includes('..') || path.isAbsolute(trimmed)) {
        throw new Error('Invalid filename: path traversal is not allowed');
    }
    const basename = path.basename(trimmed);
    if (!basename || basename.startsWith('.')) {
        throw new Error('Invalid filename');
    }
    return basename;
}

/**
 * Ensure the workspace directory exists.
 * @returns {string} absolute path to the workspace directory
 */
function ensureWorkspaceDir() {
    fs.mkdirSync(WORKSPACE_ROOT, { recursive: true });
    return WORKSPACE_ROOT;
}

/**
 * List all files in the workspace.
 * @returns {Promise<Array<{name: string, size: number, lastModified: string, path: string, mimeType: string}>>}
 */
async function listFiles() {
    const dir = ensureWorkspaceDir();

    try {
        const entries = await fs.promises.readdir(dir, { withFileTypes: true });
        const files = [];

        for (const entry of entries) {
            if (!entry.isFile()) continue;
            if (entry.name.startsWith('.')) continue;

            try {
                const filePath = path.join(dir, entry.name);
                const stat = await fs.promises.stat(filePath);
                files.push({
                    name: entry.name,
                    size: stat.size,
                    lastModified: stat.mtime.toISOString(),
                    path: entry.name,
                    mimeType: guessMimeType(entry.name)
                });
            } catch (statErr) {
                logger.warn('Failed to stat workspace file', { file: entry.name, error: statErr.message });
            }
        }

        return files.sort((a, b) => b.lastModified.localeCompare(a.lastModified));
    } catch (err) {
        if (err.code === 'ENOENT') return [];
        throw err;
    }
}

/**
 * Read a file from the workspace.
 * @param {string} filename
 * @returns {Promise<{buffer: Buffer, mimeType: string, size: number}>}
 */
async function readFile(filename) {
    const safeName = sanitizeFilename(filename);
    const dir = ensureWorkspaceDir();
    const filePath = path.join(dir, safeName);

    try {
        const stat = await fs.promises.stat(filePath);
        if (!stat.isFile()) throw new Error('Not a file');
        const buffer = await fs.promises.readFile(filePath);
        return {
            buffer,
            mimeType: guessMimeType(safeName),
            size: stat.size
        };
    } catch (err) {
        if (err.code === 'ENOENT') {
            const error = new Error(`File not found: ${safeName}`);
            error.code = 'NOT_FOUND';
            throw error;
        }
        throw err;
    }
}

/**
 * Write a file to the workspace.
 * @param {string} filename
 * @param {Buffer|string} content - Buffer for binary, string for text
 * @param {object} [options]
 * @param {string} [options.mimeType]
 * @param {string} [options.source] - 'user' or 'agent'
 * @returns {Promise<{name: string, size: number, path: string, mimeType: string}>}
 */
async function writeFile(filename, content, options = {}) {
    const safeName = sanitizeFilename(filename);
    const dir = ensureWorkspaceDir();
    const filePath = path.join(dir, safeName);

    const buffer = Buffer.isBuffer(content) ? content : Buffer.from(content, 'utf-8');

    if (buffer.length > MAX_FILE_SIZE) {
        throw new Error(`File too large: ${buffer.length} bytes exceeds maximum of ${MAX_FILE_SIZE} bytes`);
    }

    await fs.promises.writeFile(filePath, buffer);

    const mimeType = options.mimeType || guessMimeType(safeName);
    logger.info('Workspace file written', {
        file: safeName,
        size: buffer.length,
        source: options.source || 'unknown'
    });

    return {
        name: safeName,
        size: buffer.length,
        path: safeName,
        mimeType
    };
}

/**
 * Delete a file from the workspace.
 * @param {string} filename
 * @returns {Promise<void>}
 */
async function deleteFile(filename) {
    const safeName = sanitizeFilename(filename);
    const dir = ensureWorkspaceDir();
    const filePath = path.join(dir, safeName);

    try {
        await fs.promises.unlink(filePath);
        logger.info('Workspace file deleted', { file: safeName });
    } catch (err) {
        if (err.code === 'ENOENT') {
            const error = new Error(`File not found: ${safeName}`);
            error.code = 'NOT_FOUND';
            throw error;
        }
        throw err;
    }
}

/**
 * Guess MIME type from file extension.
 * @param {string} filename
 * @returns {string}
 */
function guessMimeType(filename) {
    const ext = path.extname(filename).toLowerCase();
    const mimeMap = {
        '.txt': 'text/plain',
        '.md': 'text/markdown',
        '.html': 'text/html',
        '.css': 'text/css',
        '.js': 'application/javascript',
        '.json': 'application/json',
        '.csv': 'text/csv',
        '.xml': 'application/xml',
        '.pdf': 'application/pdf',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.gif': 'image/gif',
        '.svg': 'image/svg+xml',
        '.webp': 'image/webp',
        '.doc': 'application/msword',
        '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        '.xls': 'application/vnd.ms-excel',
        '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        '.zip': 'application/zip',
        '.yaml': 'text/yaml',
        '.yml': 'text/yaml',
        '.log': 'text/plain',
        '.env': 'text/plain'
    };
    return mimeMap[ext] || 'application/octet-stream';
}

/**
 * Check if a mime type represents a text-based file.
 * @param {string} mimeType
 * @returns {boolean}
 */
function isTextMimeType(mimeType) {
    return mimeType.startsWith('text/') ||
        mimeType === 'application/json' ||
        mimeType === 'application/javascript' ||
        mimeType === 'application/xml';
}

module.exports = {
    listFiles,
    readFile,
    writeFile,
    deleteFile,
    sanitizeFilename,
    guessMimeType,
    isTextMimeType,
    WORKSPACE_ROOT,
    MAX_FILE_SIZE
};
