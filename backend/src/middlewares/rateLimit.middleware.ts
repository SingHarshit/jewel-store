import rateLimit from 'express-rate-limit';
export const authRateLimit = rateLimit({ windowMs: 15 * 60 * 1000, limit: 30, standardHeaders: true });
export const calculationRateLimit = rateLimit({ windowMs: 60 * 1000, limit: 120, standardHeaders: true });
