import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { authController } from './auth.controller.js';
import {
  loginSchema,
  registerSchema,
  magicLinkSchema,
  verifyOtpSchema,
  googleAuthSchema
} from './auth.schema.js';

export const authRoutes = Router();

authRoutes.post('/register', validate(registerSchema), authController.register);
authRoutes.post('/login', validate(loginSchema), authController.login);
authRoutes.post('/magic-link', validate(magicLinkSchema), authController.magicLink);
authRoutes.post('/magic-link/verify', validate(verifyOtpSchema), authController.verifyOtp);
authRoutes.post('/oauth/google', validate(googleAuthSchema), authController.google);
authRoutes.post('/demo/customer', authController.demoCustomer);
authRoutes.post('/demo/admin', authController.demoAdmin);
authRoutes.get('/me', authenticate, authController.me);
authRoutes.post('/logout', authController.logout);
