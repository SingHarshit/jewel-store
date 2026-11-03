import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { ordersController } from './orders.controller.js';

export const ordersRoutes = Router();

// Public Razorpay webhook endpoint (called by Razorpay servers)
ordersRoutes.post('/webhook', ordersController.webhook);

// Authenticated user & admin endpoints
ordersRoutes.use(authenticate);

ordersRoutes.get('/', ordersController.getAll);
ordersRoutes.post('/checkout', ordersController.checkout);
ordersRoutes.post('/verify-payment', ordersController.verifyPayment);
ordersRoutes.post('/payment-failed', ordersController.paymentFailed);
ordersRoutes.get('/:id', ordersController.getById);
ordersRoutes.post('/:id/cancel', ordersController.cancel);
ordersRoutes.post('/:id/refund', ordersController.refund);
ordersRoutes.post('/:id/approve-cad', ordersController.approveCad);
