import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requireRole } from '../../middlewares/rbac.middleware.js';
import { adminCmsController } from './admin.cms.controller.js';
import { adminOrdersController } from './admin.orders.controller.js';
import { adminPricingController } from './admin.pricing.controller.js';
import { adminProductsController } from './admin.products.controller.js';

export const adminRoutes = Router();

// Protect entire admin tree with Bearer JWT + 'admin' role
adminRoutes.use(authenticate, requireRole('admin'));

// Products CRUD
adminRoutes.get('/products', adminProductsController.getAll);
adminRoutes.post('/products', adminProductsController.create);
adminRoutes.put('/products/:id', adminProductsController.update);
adminRoutes.patch('/products/:id', adminProductsController.update);
adminRoutes.delete('/products/:id', adminProductsController.delete);

// Pricing Matrix
adminRoutes.get('/pricing', adminPricingController.get);
adminRoutes.put('/pricing', adminPricingController.update);
adminRoutes.patch('/pricing', adminPricingController.update);

// Order Pipeline & Stages
adminRoutes.get('/orders', adminOrdersController.getAll);
adminRoutes.patch('/orders/:id/stage', adminOrdersController.updateStage);
adminRoutes.post('/vault/issue', adminOrdersController.issueVaultCertificate);

// Storefront CMS
adminRoutes.get('/cms', adminCmsController.get);
adminRoutes.put('/cms', adminCmsController.update);
adminRoutes.patch('/cms', adminCmsController.update);
