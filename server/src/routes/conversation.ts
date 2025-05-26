import express, { Request, Response } from 'express';
import { PrismaClient, Conversation } from '@prisma/client';
import PropTypes from 'prop-types';

const router = express.Router();
const prisma = new PrismaClient();

/**
 * @typedef {Object} ConversationData
 * @property {string} id
 * @property {object} data
 * @property {string} createdAt
 * @property {string} updatedAt
 */

/**
 * Get all conversations
 */
router.get('/', async (_req: Request, res: Response) => {
  try {
    const conversations = await prisma.conversation.findMany();
    res.json(conversations);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

/**
 * Create a new conversation
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const { data } = req.body;
    const conversation = await prisma.conversation.create({
      data: { data },
    });
    res.status(201).json(conversation);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create conversation' });
  }
});

/**
 * Get a conversation by ID
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const conversation = await prisma.conversation.findUnique({ where: { id } });
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }
    res.json(conversation);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch conversation' });
  }
});

/**
 * Update a conversation by ID
 */
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { data } = req.body;
    const conversation = await prisma.conversation.update({
      where: { id },
      data: { data },
    });
    res.json(conversation);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update conversation' });
  }
});

/**
 * Delete a conversation by ID
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.conversation.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete conversation' });
  }
});

// PropTypes validation for ConversationData
export const ConversationDataPropTypes = {
  id: PropTypes.string.isRequired,
  data: PropTypes.object.isRequired,
  createdAt: PropTypes.string.isRequired,
  updatedAt: PropTypes.string.isRequired,
};

export default router; 