import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { designsController } from './designs.controller.js';
import { profileController } from './profile.controller.js';
import { vaultController } from './vault.controller.js';

export const userRoutes = Router();

// Public certificate verification
userRoutes.get('/vault/certificate/:certificateNumber', vaultController.getCertificate);

// Protected routes
userRoutes.use(authenticate);

// Profile
userRoutes.get('/profile', profileController.getProfile);
userRoutes.get('/me', profileController.getProfile);
userRoutes.patch('/profile', profileController.updateProfile);

// Saved Designs
userRoutes.get('/designs', designsController.getAll);
userRoutes.post('/designs', designsController.save);
userRoutes.delete('/designs/:id', designsController.delete);

// Digital Vault & Resize
userRoutes.get('/vault', vaultController.getVault);
userRoutes.post('/vault/:id/resize', vaultController.requestResize);
