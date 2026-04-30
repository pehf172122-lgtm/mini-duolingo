import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import routes from './routes';
import { createServiceProxy } from './services/proxy.service';
import { errorMiddleware } from './middlewares/error.middleware';
import { authMiddleware } from './middlewares/auth.middleware';
import { loggerMiddleware } from './middlewares/logger.middleware';
import config from './config/env';
import dotenv from 'dotenv';

dotenv.config();

const app: Application = express();

app.use(helmet() as any);
const allowedOrigin = process.env.FRONTEND_ORIGIN || 'http://localhost:5173';
app.use(
  cors({
    origin: allowedOrigin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));
app.use(loggerMiddleware);

// 🔹 URLs
const userServiceUrl =
  (config.SERVICES && config.SERVICES.USER) ||
  process.env.USER_SERVICE_URL ||
  'http://127.0.0.1:4000';

const contentServiceUrl =
  (config.SERVICES && config.SERVICES.CONTENT) ||
  process.env.CONTENT_SERVICE_URL ||
  'http://127.0.0.1:5000';


const vocabularyServiceUrl =
  (config.SERVICES && config.SERVICES.VOCABULARY) ||
  process.env.VOCABULARY_SERVICE_URL ||
  'http://127.0.0.1:5100';


const pronunciationServiceUrl =
  (config.SERVICES && config.SERVICES.PRONUNCIATION) ||
  process.env.PRONUNCIATION_SERVICE_URL ||
  'http://127.0.0.1:5200';


const gamificationServiceUrl =
  (config.SERVICES && config.SERVICES.GAMIFICATION) ||
  process.env.GAMIFICATION_SERVICE_URL ||
  'http://127.0.0.1:5300';


// 🔹 PROXIES
// 🔹 PROXIES
app.use('/api/v1/auth', createServiceProxy(userServiceUrl, 'user-service'));
app.use('/api/v1/users', createServiceProxy(userServiceUrl, 'user-service'));

app.use('/api/v1/content', authMiddleware);
app.use('/api/v1/content', createServiceProxy(contentServiceUrl, 'content-service'));

app.use(
  '/api/v1/vocabulary',
  authMiddleware,
  createServiceProxy(vocabularyServiceUrl, 'vocabulary-service', {
    pathRewrite: {
      '^/api/v1/vocabulary': '/api/v1/words'
    }
  })
);

app.use(
  '/api/v1/pronunciation',
  authMiddleware,
  createServiceProxy(pronunciationServiceUrl, 'pronunciation-service')
);

app.use(
  '/api/v1/gamification',
  authMiddleware,
  createServiceProxy(gamificationServiceUrl, 'gamification-service')
);

// 🔹 Otras rutas
app.use('/api', routes);

app.get('/health', (_req, res) =>
  res.json({ status: 'ok', service: 'api-gateway' })
);

app.use(errorMiddleware);

export default app;