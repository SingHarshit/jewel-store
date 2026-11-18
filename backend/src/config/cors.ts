import cors from 'cors';
import { env } from './env.js';

const allowedOrigins = new Set(
  (env.FRONTEND_URL || '*')
    .split(',')
    .map((url) => url.trim())
    .filter(Boolean)
);

// Keep local development working when the frontend uses the deployed API.
allowedOrigins.add('http://localhost:5173');
allowedOrigins.add('http://127.0.0.1:5173');

export const corsMiddleware = cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g. mobile apps, curl, or same-origin Nginx proxying)
    if (!origin || allowedOrigins.has('*') || allowedOrigins.has(origin)) {
      return callback(null, true);
    }
    return callback(new Error(`Not allowed by CORS: ${origin}`));
  },
  credentials: true,
});
