const request = require('supertest');
const express = require('express');
const { authenticateToken } = require('../src/middleware/auth');
const chatRouter = require('../src/routes/chat');

// Mock dependencies
jest.mock('../src/middleware/auth', () => ({
  authenticateToken: jest.fn((req, res, next) => {
    req.user = { id: 'test-user-id' };
    next();
  })
}));

// Create test app
const app = express();
app.use(express.json());
app.use('/api/chat', chatRouter);

describe('Chat API Endpoints', () => {
  describe('POST /api/chat/message', () => {
    it('should process a chat message and return a response', async () => {
      const response = await request(app)
        .post('/api/chat/message')
        .set('Authorization', 'Bearer test-token')
        .send({
          message: 'Hello',
          context: {
            section: 'mission',
            companyName: 'Test Company'
          }
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('conversationId');
      expect(response.body.data).toHaveProperty('reply');
      expect(response.body.data).toHaveProperty('timestamp');
    });

    it('should return 401 if not authenticated', async () => {
      authenticateToken.mockImplementationOnce((req, res, next) => {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      });

      const response = await request(app)
        .post('/api/chat/message')
        .send({
          message: 'Hello'
        });

      expect(response.status).toBe(401);
    });

    it('should return 400 if message is missing', async () => {
      const response = await request(app)
        .post('/api/chat/message')
        .set('Authorization', 'Bearer test-token')
        .send({
          context: {}
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('POST /api/chat/attachments', () => {
    it('should handle file uploads', async () => {
      const response = await request(app)
        .post('/api/chat/attachments')
        .set('Authorization', 'Bearer test-token')
        .attach('files', Buffer.from('test'), 'test.txt')
        .field('conversationId', 'test-conversation-id');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data[0]).toHaveProperty('id');
      expect(response.body.data[0]).toHaveProperty('url');
    });
  });
});