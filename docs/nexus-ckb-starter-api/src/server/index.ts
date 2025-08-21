import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import pino from 'pino';
import { registerDocRoutes } from './routes/documents.js';
import { registerRagRoutes } from './routes/rag.js';

const app = express();
const logger = pino({ level: process.env.LOG_LEVEL || 'info' });
const origins = (process.env.CORS_ORIGINS || '*').split(',');
app.use(cors({ origin: origins.includes('*') ? true : origins }));
app.use(express.json({ limit: '10mb' }));
registerDocRoutes(app, logger);
registerRagRoutes(app, logger);
const port = Number(process.env.PORT || 8080);
app.listen(port, () => logger.info(`CKB API running on :${port}`));
