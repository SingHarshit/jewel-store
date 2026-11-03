import express from 'express';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { corsMiddleware } from './config/cors.js';
import { errorMiddleware } from './middlewares/error.middleware.js';
import { routes } from './routes.js';

export const app = express();

app.use(helmet());
app.use(corsMiddleware);
app.use(cookieParser());
app.use(
  express.json({
    limit: '10mb',
    verify: (req: any, _res, buf) => {
      req.rawBody = buf;
    }
  })
);
app.use(express.urlencoded({ extended: true }));

// Root health check
app.get('/health', (_req, res) => res.json({ status: 'ok' }));

// Mount API v1
app.use('/api/v1', routes);

// Centralized error handler
app.use(errorMiddleware);
