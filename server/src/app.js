import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import { env } from './config/env.js';
import routes from './routes/index.js';
import { serverTiming } from './middleware/serverTiming.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';

const app = express();

// Performance & timing metrics
app.use(serverTiming);

// Security headers
app.use(helmet());

// Cross-origin resource sharing
const allowedOrigins = [
  env.portalUrl,
  env.opsUrl,
  'http://localhost:5173',
  'http://localhost:5174',
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`CORS policy does not allow access from ${origin}`));
    },
    credentials: true,
  })
);

app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());

if (env.nodeEnv !== 'test') {
  app.use(morgan('dev'));
}

// API Routes
app.use('/api', routes);

// Error Handling
app.use(notFound);
app.use(errorHandler);

export default app;
