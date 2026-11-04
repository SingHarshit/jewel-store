import 'dotenv/config';
import { z } from 'zod';

const schema = z.object({
  PORT: z.coerce.number().int().positive().default(5000),
  DATABASE_URL: z.string().min(1).default('postgresql://postgres:postgres@localhost:5432/heirest_jewelry?schema=public'),
  JWT_SECRET: z.string().min(10).default('heirest-super-secret-2026'),
  REDIS_URL: z.string().optional().default('redis://localhost:6379'),
  FRONTEND_URL: z.string().default('http://localhost:5173'),
  RAZORPAY_KEY_ID: z.string().default('rzp_test_HeirestDemoKey2026'),
  RAZORPAY_KEY_SECRET: z.string().default('heirest_razorpay_test_secret_2026'),
  RAZORPAY_WEBHOOK_SECRET: z.string().default('heirest_webhook_secret_2026')
});

export const env = schema.parse(process.env);
