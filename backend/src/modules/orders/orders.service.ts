import { OrderStage, OrderStatus, PaymentStatus, PaymentMethod } from '@prisma/client';
import { prisma } from '../../config/db.js';
import { env } from '../../config/env.js';
import { ApiError } from '../../utils/ApiError.js';
import { paymentService } from './payment.service.js';

export function build8StageTimeline(
  currentStage: OrderStage,
  cadApproved: boolean = false
) {
  const stageKeys: { stage: OrderStage; label: string; description: string }[] = [
    { stage: OrderStage.SPECS_LOCKED, label: '01. Specs Locked', description: 'Your configuration has been confirmed and sent to our design studio.' },
    { stage: OrderStage.CAD_APPROVAL, label: '02. 3D CAD Render Approval', description: 'Our master jeweller has created a precision 3D CAD render. Please review and approve before casting begins.' },
    { stage: OrderStage.METAL_CASTING, label: '03. Metal Casting', description: 'Your ring is being cast in solid gold using lost-wax casting by our third-generation craftsmen.' },
    { stage: OrderStage.STONE_SELECTION, label: '04. Hand-Picked Stone Selection', description: 'Our gemologist hand-selects your stone from a curated lot to match your specifications precisely.' },
    { stage: OrderStage.MASTER_SETTING, label: '05. Master Setting', description: 'Your stone is hand-set by our master setter with loupes and precision tools.' },
    { stage: OrderStage.HAND_POLISHING, label: '06. Hand Polishing', description: 'Your piece is brought to a mirror finish using traditional hand-polishing techniques.' },
    { stage: OrderStage.QUALITY_CONTROL, label: '07. 8-Point Quality Control', description: 'Independent gemological inspection: stone security, metal integrity, finish, weight, dimensions, engraving, documentation.' },
    { stage: OrderStage.DISPATCHED, label: '08. Insured DHL Express Dispatch', description: 'Your piece ships fully insured via DHL Express with real-time tracking.' }
  ];

  const currentIdx = stageKeys.findIndex((s) => s.stage === currentStage);

  return stageKeys.map((s, idx) => ({
    stage: s.stage.toLowerCase(),
    label: s.label,
    description: s.description,
    isPending: idx > currentIdx,
    isActive: idx === currentIdx,
    requiresApproval: s.stage === OrderStage.CAD_APPROVAL && idx === currentIdx && !cadApproved,
    completedAt: idx < currentIdx ? new Date(Date.now() - (currentIdx - idx) * 86400000 * 2).toISOString() : undefined
  }));
}

export const ordersService = {
  async getAllOrders(userId: string) {
    const orders = await prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        transactions: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    return orders.map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      items: o.items,
      totalUSD: Number(o.totalAmount),
      totalAmount: Number(o.totalAmount),
      currency: o.currency,
      orderStatus: o.orderStatus,
      paymentStatus: o.paymentStatus,
      paymentMethod: o.paymentMethod,
      razorpayOrderId: o.razorpayOrderId,
      razorpayPaymentId: o.razorpayPaymentId,
      shippingAddress: o.shippingAddress,
      orderNotes: o.orderNotes,
      cancellationReason: o.cancellationReason,
      cancelledAt: o.cancelledAt?.toISOString(),
      refundId: o.refundId,
      placedAt: o.createdAt.toISOString(),
      estimatedCompletionDate:
        o.estimatedCompletionDate?.toISOString() ??
        new Date(o.createdAt.getTime() + 21 * 86400000).toISOString(),
      currentStage: o.currentStage.toLowerCase(),
      stages: o.stages,
      trackingNumber: o.trackingNumber,
      cadRenderApproved: o.cadRenderApproved,
      cadRenderUrl: o.cadRenderUrl,
      transactions: o.transactions
    }));
  },

  async getOrderById(orderId: string, userId?: string) {
    const order = await prisma.order.findFirst({
      where: {
        OR: [{ id: orderId }, { orderNumber: orderId }],
        ...(userId ? { userId } : {})
      },
      include: {
        transactions: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!order) {
      throw new ApiError(404, `Order not found: ${orderId}`);
    }

    return {
      id: order.id,
      orderNumber: order.orderNumber,
      items: order.items,
      totalUSD: Number(order.totalAmount),
      totalAmount: Number(order.totalAmount),
      currency: order.currency,
      orderStatus: order.orderStatus,
      paymentStatus: order.paymentStatus,
      paymentMethod: order.paymentMethod,
      razorpayOrderId: order.razorpayOrderId,
      razorpayPaymentId: order.razorpayPaymentId,
      shippingAddress: order.shippingAddress,
      orderNotes: order.orderNotes,
      cancellationReason: order.cancellationReason,
      cancelledAt: order.cancelledAt?.toISOString(),
      refundId: order.refundId,
      placedAt: order.createdAt.toISOString(),
      estimatedCompletionDate:
        order.estimatedCompletionDate?.toISOString() ??
        new Date(order.createdAt.getTime() + 21 * 86400000).toISOString(),
      currentStage: order.currentStage.toLowerCase(),
      stages: order.stages,
      trackingNumber: order.trackingNumber,
      cadRenderApproved: order.cadRenderApproved,
      cadRenderUrl: order.cadRenderUrl,
      transactions: order.transactions
    };
  },

  /**
   * Checkout: transactional creation of order, voucher redemption, and Razorpay order initialization
   */
  async checkout(
    userId: string,
    payload: {
      items: any[];
      shippingAddress: any;
      currency?: string;
      sizingKitVoucherCode?: string;
      orderNotes?: string;
      paymentMethod?: PaymentMethod;
    }
  ) {
    if (!payload.items || payload.items.length === 0) {
      throw new ApiError(400, 'Cart cannot be empty for checkout');
    }

    return await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({ where: { id: userId } });
      if (!user) throw new ApiError(404, 'User not found');

      let subtotal = payload.items.reduce((sum, item) => {
        const itemPrice = Number(item.priceUSD || item.totalPrice || 2500);
        const qty = Number(item.quantity || 1);
        return sum + itemPrice * qty;
      }, 0);

      // Voucher deduction logic ($19 discount for sizing kit voucher, supports existing $35 as well)
      let voucherDiscount = 0;
      if (payload.sizingKitVoucherCode) {
        // Standardize $19 voucher discount for Sizing Kit voucher
        voucherDiscount = payload.sizingKitVoucherCode.includes('35') ? 35 : 19;
        await tx.user.update({
          where: { id: userId },
          data: { sizingKitRedeemed: true }
        });
      }

      const totalAmount = Math.max(0, subtotal - voucherDiscount);
      const randomOrderNum = Math.floor(1000 + Math.random() * 9000);
      const orderNumber = `HRS-${new Date().getFullYear()}-${randomOrderNum}`;

      // Initialize initial stages
      const initialStages = build8StageTimeline(OrderStage.SPECS_LOCKED, false);

      // 1. Create order in PostgreSQL
      const createdOrder = await tx.order.create({
        data: {
          orderNumber,
          userId,
          items: payload.items,
          totalAmount,
          currency: payload.currency || 'USD',
          orderStatus: OrderStatus.PENDING_PAYMENT,
          paymentStatus: PaymentStatus.PENDING,
          paymentMethod: payload.paymentMethod || PaymentMethod.RAZORPAY,
          currentStage: OrderStage.SPECS_LOCKED,
          stages: initialStages,
          shippingAddress: payload.shippingAddress,
          orderNotes: payload.orderNotes || null,
          cadRenderApproved: false,
          cadRenderUrl: `https://heirest.com/cad-renders/${orderNumber.toLowerCase()}`,
          estimatedCompletionDate: new Date(Date.now() + 21 * 86400000)
        }
      });

      // 2. Generate Razorpay Order
      const rzpOrder = await paymentService.createRazorpayOrder(
        totalAmount,
        payload.currency || 'USD',
        orderNumber,
        {
          orderId: createdOrder.id,
          orderNumber,
          userId
        }
      );

      // 3. Update order with razorpayOrderId
      const updatedOrder = await tx.order.update({
        where: { id: createdOrder.id },
        data: {
          razorpayOrderId: rzpOrder.id
        }
      });

      // 4. Create pending PaymentTransaction record
      await tx.paymentTransaction.create({
        data: {
          orderId: updatedOrder.id,
          razorpayOrderId: rzpOrder.id,
          amount: updatedOrder.totalAmount,
          currency: updatedOrder.currency,
          status: PaymentStatus.PENDING,
          method: payload.paymentMethod || 'RAZORPAY'
        }
      });

      return {
        id: updatedOrder.id,
        orderNumber: updatedOrder.orderNumber,
        totalUSD: Number(updatedOrder.totalAmount),
        totalAmount: Number(updatedOrder.totalAmount),
        amountInCents: Math.round(Number(updatedOrder.totalAmount) * 100),
        currency: updatedOrder.currency,
        orderStatus: updatedOrder.orderStatus,
        paymentStatus: updatedOrder.paymentStatus,
        paymentMethod: updatedOrder.paymentMethod,
        razorpayOrderId: updatedOrder.razorpayOrderId,
        razorpayKeyId: env.RAZORPAY_KEY_ID,
        currentStage: updatedOrder.currentStage.toLowerCase(),
        stages: updatedOrder.stages,
        voucherApplied: voucherDiscount > 0,
        voucherDiscount,
        placedAt: updatedOrder.createdAt.toISOString()
      };
    });
  },

  /**
   * Verifies Razorpay payment signature and activates the order & manufacturing pipeline
   */
  async verifyPayment(params: {
    orderId: string;
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
    method?: string;
  }) {
    const isValid = paymentService.verifyPaymentSignature({
      razorpayOrderId: params.razorpayOrderId,
      razorpayPaymentId: params.razorpayPaymentId,
      razorpaySignature: params.razorpaySignature
    });

    if (!isValid) {
      await paymentService.processPaymentFailure(params.orderId, {
        razorpayOrderId: params.razorpayOrderId,
        razorpayPaymentId: params.razorpayPaymentId,
        errorCode: 'SIGNATURE_VERIFICATION_FAILED',
        errorDescription: 'The provided Razorpay HMAC signature did not match.'
      });
      throw new ApiError(400, 'Invalid payment signature. Payment verification failed.');
    }

    return await paymentService.processPaymentSuccess(params.orderId, params);
  },

  /**
   * Reports payment failure for an order
   */
  async reportPaymentFailure(params: {
    orderId: string;
    razorpayOrderId?: string;
    razorpayPaymentId?: string;
    errorCode?: string;
    errorDescription?: string;
    metadata?: any;
  }) {
    return await paymentService.processPaymentFailure(params.orderId, params);
  },

  /**
   * Cancels an order
   */
  async cancelOrder(orderId: string, userId?: string, reason?: string) {
    return await paymentService.cancelOrder(orderId, userId, reason);
  },

  /**
   * Refunds an order
   */
  async refundOrder(orderId: string, reason?: string, amount?: number) {
    return await paymentService.refundOrder(orderId, reason, amount);
  },

  /**
   * 3D CAD Approval: Advances order to next stage in manufacturing pipeline
   */
  async approveCad(orderId: string, userId?: string) {
    const order = await prisma.order.findFirst({
      where: {
        OR: [{ id: orderId }, { orderNumber: orderId }],
        ...(userId ? { userId } : {})
      }
    });

    if (!order) {
      throw new ApiError(404, 'Order not found for CAD approval');
    }

    const updatedStages = build8StageTimeline(OrderStage.METAL_CASTING, true);

    const updated = await prisma.order.update({
      where: { id: order.id },
      data: {
        cadRenderApproved: true,
        currentStage: OrderStage.METAL_CASTING,
        stages: updatedStages,
        orderStatus: OrderStatus.IN_PRODUCTION
      }
    });

    return {
      success: true,
      message: '3D CAD render approved. Casting phase initiated.',
      order: {
        id: updated.id,
        orderNumber: updated.orderNumber,
        currentStage: updated.currentStage.toLowerCase(),
        cadRenderApproved: updated.cadRenderApproved,
        stages: updated.stages
      }
    };
  }
};
