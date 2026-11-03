import cors from 'cors';
import { env } from './env.js';

const allowedOrigins = (env.FRONTEND_URL || '*')
  .split(',')
  .map((url) => url.trim());

export const corsMiddleware = cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g. mobile apps, curl, or same-origin Nginx proxying)
    if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error(`Not allowed by CORS: ${origin}`));
  },
  credentials: true,
});
