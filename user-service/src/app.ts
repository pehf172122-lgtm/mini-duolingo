import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';

import userRoutes from './routes/userRoutes';
import authRoutes from './auth/auth.routes';
import { errorHandler } from './middleware/errorHandler';

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_ORIGIN || 'http://localhost:5173', credentials: true }));
app.use(cookieParser());
app.use(morgan('dev'));
app.use(express.json());

// ✅ Rutas primero
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/auth', authRoutes);

// Health check
app.get('/', (req, res) =>
  res.json({ success: true, message: 'Service healthy', data: { service: 'user-service', version: '1.0.0' }, error: null })
);

// ❗ SIEMPRE AL FINAL
app.use(errorHandler);

export default app;