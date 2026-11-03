import type { RequestHandler } from 'express';
import { ApiError } from '../utils/ApiError.js';
import { verifyToken } from '../utils/jwt.js';

export const authenticate: RequestHandler = (req, _res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return next(new ApiError(401, 'Bearer token is required'));
  }

  const token = header.slice(7).trim();
  try {
    const decoded = verifyToken(token);
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role.toLowerCase() as 'customer' | 'admin',
      authorHandle: decoded.authorHandle
    };
    next();
  } catch {
    next(new ApiError(401, 'Invalid or expired token'));
  }
};
