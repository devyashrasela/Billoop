import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import { env } from './config/env.js';
import routes from './routes/index.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';

const app = express();
app.use(helmet());
app.use(cors({ origin: [env.portalUrl, env.opsUrl], credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());
if (env.nodeEnv !== 'test') app.use(morgan('dev'));

app.use('/api', routes);
app.use(notFound);
app.use(errorHandler);

export default app;

