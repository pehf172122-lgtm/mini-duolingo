import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import routes from './routes/pronunciation.routes';
import errorHandler from './utils/errorHandler';
import { attachUser } from './middlewares/authContext.middleware';

const app = express();

app.use(helmet() as any);
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));
app.use(attachUser);

app.use('/api/v1/pronunciation', routes);

app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'pronunciation-service' }));

app.use(errorHandler);

export default app;
