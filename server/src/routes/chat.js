const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { authenticateToken } = require('../middleware/auth');
const { createError } = require('../middleware/errorHandler');
const { query } = require('../database/connection');
const { logger } = require('../utils/logger');

const router = express.Router();

const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB
const MAX_FILES_PER_REQUEST = 5;
const UPLOAD_ROOT = path.join(__dirname, '../../uploads/chat');

function ensureUploadRoot() {
  if (!fs.existsSync(UPLOAD_ROOT)) {
    fs.mkdirSync(UPLOAD_ROOT, { recursive: true });
  }
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    try {
      const conversationId = req.body.conversationId;
      if (!conversationId) {
        return cb(new Error('conversationId is required'));
      }

      ensureUploadRoot();
      const conversationDir = path.join(UPLOAD_ROOT, conversationId);
      if (!fs.existsSync(conversationDir)) {
        fs.mkdirSync(conversationDir, { recursive: true });
      }

      cb(null, conversationDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const sanitized = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, `${timestamp}-${sanitized}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE_BYTES,
    files: MAX_FILES_PER_REQUEST
  }
});

async function verifyConversationOwnership(conversationId, userId, jwtPayload) {
  const result = await query(
    'SELECT id FROM ai_conversations WHERE id = $1 AND user_id = $2 LIMIT 1',
    [conversationId, userId],
    jwtPayload
  );

  if (result.error) {
    throw createError(result.error, 500);
  }

  if (!result.data || result.data.length === 0) {
    throw createError('Conversation not found', 404);
  }
}

router.post(
  '/attachments',
  authenticateToken,
  upload.array('files', MAX_FILES_PER_REQUEST),
  async (req, res) => {
    try {
      const userId = req.user?.id;
      const jwtPayload = req.user?.jwtPayload || { sub: userId };
      const { conversationId, messageId } = req.body;
      const files = req.files || [];

      if (!conversationId) {
        throw createError('conversationId is required', 400);
      }

      if (!userId) {
        throw createError('Unauthorized', 401);
      }

      if (!files.length) {
        throw createError('No files uploaded', 400);
      }

      await verifyConversationOwnership(conversationId, userId, jwtPayload);

      const attachments = [];

      for (const file of files) {
        const relativePath = path.relative(process.cwd(), file.path);
        const metadata = {
          diskFilename: path.basename(file.path),
          originalName: file.originalname
        };

        const insertResult = await query(
          `INSERT INTO ai_message_attachments 
            (conversation_id, message_id, user_id, file_name, file_type, file_size, storage_path, metadata)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           RETURNING id, conversation_id, message_id, file_name, file_type, file_size, storage_path, created_at`,
          [
            conversationId,
            messageId || null,
            userId,
            file.originalname,
            file.mimetype,
            file.size,
            relativePath,
            JSON.stringify(metadata)
          ],
          jwtPayload
        );

        if (insertResult.error) {
          logger.error('Failed to insert attachment metadata', {
            error: insertResult.error,
            conversationId,
            file: file.originalname
          });
          throw createError('Failed to save attachment metadata', 500);
        }

        const attachment = insertResult.data?.[0];
        if (!attachment) {
          throw createError('Failed to save attachment metadata', 500);
        }

        attachments.push({
          id: attachment.id,
          conversationId: attachment.conversation_id,
          messageId: attachment.message_id,
          name: attachment.file_name,
          type: attachment.file_type,
          size: attachment.file_size,
          createdAt: attachment.created_at,
          url: `/api/chat/attachments/${attachment.id}/download`
        });
      }

      res.json({
        success: true,
        data: attachments
      });
    } catch (error) {
      logger.error('Attachment upload failed', {
        error: error.message,
        stack: error.stack,
        userId: req.user?.id,
        conversationId: req.body?.conversationId
      });

      res.status(error.statusCode || 500).json({
        success: false,
        error: error.message || 'Failed to upload attachments'
      });
    }
  }
);

router.get('/attachments/:id/download', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.id;
    const jwtPayload = req.user?.jwtPayload || { sub: userId };
    const { id } = req.params;

    const result = await query(
      `SELECT a.*, c.user_id AS conversation_user_id
       FROM ai_message_attachments a
       JOIN ai_conversations c ON c.id = a.conversation_id
       WHERE a.id = $1`,
      [id],
      jwtPayload
    );

    if (result.error) {
      throw createError(result.error, 500);
    }

    const attachment = result.data?.[0];
    if (!attachment) {
      throw createError('Attachment not found', 404);
    }

    if (attachment.conversation_user_id !== userId) {
      throw createError('Unauthorized', 403);
    }

    const absolutePath = path.isAbsolute(attachment.storage_path)
      ? attachment.storage_path
      : path.join(process.cwd(), attachment.storage_path);

    if (!fs.existsSync(absolutePath)) {
      throw createError('File not found on server', 404);
    }

    res.download(absolutePath, attachment.file_name);
  } catch (error) {
    logger.error('Attachment download failed', {
      error: error.message,
      stack: error.stack,
      attachmentId: req.params?.id,
      userId: req.user?.id
    });

    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message || 'Failed to download attachment'
    });
  }
});

module.exports = router;
