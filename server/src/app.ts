import express from 'express';
import conversationRouter from './routes/conversation';

/**
 * Main Express application for Nexus API
 * @module app
 */
const app = express();

app.use(express.json());
app.use('/conversations', conversationRouter);

export default app; 