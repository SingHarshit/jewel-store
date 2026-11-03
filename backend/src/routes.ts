import { Router } from 'express';
import { prisma } from './config/db.js';
import { adminRoutes } from './modules/admin/admin.routes.js';
import { adminService } from './modules/admin/admin.service.js';
import { authRoutes } from './modules/auth/auth.routes.js';
import { catalogRoutes } from './modules/catalog/catalog.routes.js';
import { configuratorRoutes } from './modules/configurator/configurator.routes.js';
import { ordersRoutes } from './modules/orders/orders.routes.js';
import { designsController } from './modules/user/designs.controller.js';
import { userRoutes } from './modules/user/user.routes.js';
import { authenticate } from './middlewares/auth.middleware.js';
import { asyncHandler } from './utils/asyncHandler.js';

export const routes = Router();

// ── Health Check (Verifies PostgreSQL connection) ─────────────
routes.get(
  '/health',
  asyncHandler(async (_req, res) => {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'PostgreSQL connected',
      environment: process.env.NODE_ENV || 'development'
    });
  })
);

// ── Public Storefront CMS ────────────────────────────────────
routes.get(
  '/cms',
  asyncHandler(async (_req, res) => {
    const cms = await adminService.getCmsSettings();
    res.status(200).json(cms);
  })
);

// ── Mount All Feature Routes ─────────────────────────────────
routes.use('/auth', authRoutes);
routes.use('/catalog', catalogRoutes);
routes.use('/products', catalogRoutes);
routes.use('/configurator', configuratorRoutes);
routes.use('/pricing', configuratorRoutes);
routes.use('/user', userRoutes);
routes.use('/orders', ordersRoutes);
routes.use('/admin', adminRoutes);

// Direct top-level /designs route support for frontend client
routes.get('/designs', authenticate, designsController.getAll);
routes.post('/designs', authenticate, designsController.save);
routes.delete('/designs/:id', authenticate, designsController.delete);
