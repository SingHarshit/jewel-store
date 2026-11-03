import type { RequestHandler } from 'express';
import { ApiError } from '../utils/ApiError.js';

export const requireRole = (...roles: string[]): RequestHandler => {
  const allowed = roles.map((r) => r.toLowerCase());
  return (req, _res, next) => {
    if (!req.user) {
      return next(new ApiError(401, 'Authentication required'));
    }

    const userRole = (req.user.role ?? '').toLowerCase();
    if (!allowed.includes(userRole)) {
      return next(new ApiError(403, `Access denied: requires one of [${roles.join(', ')}] role`));
    }

    next();
  };
};
