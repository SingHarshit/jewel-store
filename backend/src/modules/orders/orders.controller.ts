import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiError } from '../../utils/ApiError.js';
import { ordersService } from './orders.service.js';
import { paymentService } from './payment.service.js';

export const ordersController = {
  getAll: asyncHandler(async (req, res) => {
    const orders = await ordersService.getAllOrders(req.user!.id);
    res.status(200).json(orders);
  }),

  getById: asyncHandler(async (req, res) => {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const order = await ordersService.getOrderById(id, req.user?.id);
    res.status(200).json(order);
  }),

  checkout: asyncHandler(async (req, res) => {
    const order = await ordersService.checkout(req.user!.id, req.body);
    res.status(201).json(order);
  }),

  verifyPayment: asyncHandler(async (req, res) => {
    const { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature, method } = req.body;

    if (!orderId || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      throw new ApiError(
        400,
        'Missing required payment verification fields: orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature'
      );
    }

    const result = await ordersService.verifyPayment({
      orderId,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      method
    });

    res.status(200).json(result);
  }),

  paymentFailed: asyncHandler(async (req, res) => {
    const { orderId, razorpayOrderId, razorpayPaymentId, errorCode, errorDescription, metadata } =
      req.body;

    if (!orderId) {
      throw new ApiError(400, 'Missing orderId for recording failed payment');
    }

    const result = await ordersService.reportPaymentFailure({
      orderId,
      razorpayOrderId,
      razorpayPaymentId,
      errorCode,
      errorDescription,
      metadata
    });

    res.status(200).json(result);
  }),

  cancel: asyncHandler(async (req, res) => {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { reason } = req.body;
    const result = await ordersService.cancelOrder(id, req.user?.id, reason);
    res.status(200).json(result);
  }),

  refund: asyncHandler(async (req, res) => {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { reason, amount } = req.body;
    const result = await ordersService.refundOrder(id, reason, amount);
    res.status(200).json(result);
  }),

  approveCad: asyncHandler(async (req, res) => {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const result = await ordersService.approveCad(id, req.user?.id);
    res.status(200).json(result);
  }),

  webhook: asyncHandler(async (req, res) => {
    const signature = req.headers['x-razorpay-signature'] as string;
    const rawBody = req.rawBody || Buffer.from(JSON.stringify(req.body));

    if (signature) {
      const isValid = paymentService.verifyWebhookSignature(rawBody, signature);
      if (!isValid) {
        throw new ApiError(400, 'Invalid Razorpay webhook signature');
      }
    }

    const { event, payload } = req.body;
    await paymentService.handleWebhook(event, payload);

    res.status(200).json({ received: true });
  })
};
