import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import routes from './routes/gamification.routes';
import errorHandler from './utils/errorHandler';
import { attachUser } from './middlewares/authContext.middleware';

const app = express();

app.use(helmet() as any);
app.use(cors());
app.use(attachUser);
app.use(express.json());
app.use(morgan('dev'));

app.use('/api/v1/gamification', routes);

app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'gamification-service' }));

app.use(errorHandler);

export default app;
