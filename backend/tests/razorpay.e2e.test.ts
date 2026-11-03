import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import crypto from 'node:crypto';
import { app } from '../src/app.js';
import { prisma } from '../src/config/db.js';
import { env } from '../src/config/env.js';

describe('Razorpay Payment Gateway & Order Lifecycle E2E Suite', () => {
  let customerToken: string;
  let adminToken: string;
  let testUserId: string;

  beforeAll(async () => {
    // 1. Create a dedicated customer for Razorpay testing so we don't mutate demo user's seed state
    const email = `test.payment.${Date.now()}@heirest.co`;
    const customerRes = await request(app).post('/api/v1/auth/register').send({
      firstName: 'Audrey',
      lastName: 'Hepburn',
      email,
      password: 'SecurePassword123!',
      authorHandle: `audrey${Date.now().toString().slice(-4)}`
    });
    expect(customerRes.status).toBe(201);
    customerToken = customerRes.body.token;
    testUserId = customerRes.body.user.id;

    // 2. Authenticate Demo Admin
    const adminRes = await request(app).post('/api/v1/auth/demo/admin');
    expect(adminRes.status).toBe(200);
    adminToken = adminRes.body.token;
  });

  describe('Checkout & Razorpay Order Creation', () => {
    it('creates an order with PENDING_PAYMENT status and Razorpay credentials', async () => {
      const res = await request(app)
        .post('/api/v1/orders/checkout')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          items: [
            {
              id: 'ci-ring-01',
              productId: 'rg-sig-5s-001',
              productName: 'Signature Five-Stone Diamond Ring',
              sku: 'RG-5S-CLW-OV-10018YG-WLD',
              priceUSD: 5200,
              quantity: 1,
              config: { category: 'RG', style: '5S', metalPurity: '18K', metalColor: 'YG' }
            }
          ],
          shippingAddress: {
            fullName: 'India Moxley',
            phone: '+61 400 123 456',
            street: '42 Balmoral Avenue',
            city: 'Sydney',
            state: 'NSW',
            postalCode: '2041',
            country: 'Australia'
          },
          orderNotes: 'Urgent anniversary commission'
        });

      expect(res.status).toBe(201);
      expect(res.body.id).toBeDefined();
      expect(res.body.orderNumber).toContain('HRS-');
      expect(res.body.orderStatus).toBe('PENDING_PAYMENT');
      expect(res.body.paymentStatus).toBe('PENDING');
      expect(res.body.razorpayOrderId).toBeDefined();
      expect(res.body.razorpayKeyId).toBe(env.RAZORPAY_KEY_ID);
      expect(res.body.amountInCents).toBe(520000);
    });
  });

  describe('Payment Verification & 8-Stage Manufacturing Pipeline Unlocking', () => {
    it('rejects payment verification with invalid signature with 400', async () => {
      // 1. Create order
      const checkoutRes = await request(app)
        .post('/api/v1/orders/checkout')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          items: [
            {
              id: 'ci-ring-02',
              productId: 'rg-sol-001',
              productName: 'Solitaire Ring',
              sku: 'RG-SL-PRG-RD-15018WG-WLD',
              priceUSD: 3800,
              quantity: 1
            }
          ],
          shippingAddress: {
            fullName: 'India Moxley',
            phone: '+61 400 123 456',
            street: '42 Balmoral Avenue',
            city: 'Sydney',
            state: 'NSW',
            postalCode: '2041',
            country: 'Australia'
          }
        });

      expect(checkoutRes.status).toBe(201);
      const order = checkoutRes.body;

      // 2. Submit invalid signature
      const verifyRes = await request(app)
        .post('/api/v1/orders/verify-payment')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          orderId: order.id,
          razorpayOrderId: order.razorpayOrderId,
          razorpayPaymentId: 'pay_tampered_123456',
          razorpaySignature: 'invalid_forged_signature_hex'
        });

      expect(verifyRes.status).toBe(400);
      expect(verifyRes.body.error.message).toContain('Invalid payment signature');

      // Verify DB status is updated to FAILED
      const dbOrder = await prisma.order.findUnique({ where: { id: order.id } });
      expect(dbOrder?.paymentStatus).toBe('FAILED');
    });

    it('verifies genuine HMAC signature, sets order to PLACED & CAPTURED, and unlocks 8 stages', async () => {
      // 1. Create order
      const checkoutRes = await request(app)
        .post('/api/v1/orders/checkout')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          items: [
            {
              id: 'ci-ring-03',
              productId: 'rg-sol-001',
              productName: 'Solitaire Ring',
              sku: 'RG-SL-PRG-RD-15018WG-WLD',
              priceUSD: 4100,
              quantity: 1
            }
          ],
          shippingAddress: {
            fullName: 'India Moxley',
            phone: '+61 400 123 456',
            street: '42 Balmoral Avenue',
            city: 'Sydney',
            state: 'NSW',
            postalCode: '2041',
            country: 'Australia'
          }
        });

      const order = checkoutRes.body;
      const paymentId = `pay_${Date.now()}`;

      // 2. Compute authentic Razorpay HMAC SHA-256 signature
      const signaturePayload = `${order.razorpayOrderId}|${paymentId}`;
      const validSignature = crypto
        .createHmac('sha256', env.RAZORPAY_KEY_SECRET)
        .update(signaturePayload)
        .digest('hex');

      // 3. Verify payment
      const verifyRes = await request(app)
        .post('/api/v1/orders/verify-payment')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          orderId: order.id,
          razorpayOrderId: order.razorpayOrderId,
          razorpayPaymentId: paymentId,
          razorpaySignature: validSignature,
          method: 'card'
        });

      expect(verifyRes.status).toBe(200);
      expect(verifyRes.body.success).toBe(true);
      expect(verifyRes.body.order.orderStatus).toBe('PLACED');
      expect(verifyRes.body.order.paymentStatus).toBe('CAPTURED');
      expect(verifyRes.body.order.currentStage).toBe('specs_locked');
      expect(verifyRes.body.order.stages.length).toBe(8);

      // Verify audit transaction was recorded in PostgreSQL
      const transactions = await prisma.paymentTransaction.findMany({
        where: { orderId: order.id }
      });
      expect(transactions.length).toBeGreaterThanOrEqual(1);
      expect(transactions.some((t) => t.status === 'CAPTURED')).toBe(true);
    });
  });

  describe('Automatic $19 Sizing Kit Redeemable Voucher Generation & Application', () => {
    it('automatically generates a $19 voucher code on User when sizing kit order payment is captured', async () => {
      // 1. Checkout with Sizing Kit
      const checkoutRes = await request(app)
        .post('/api/v1/orders/checkout')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          items: [
            {
              id: 'ci-kit-01',
              productId: 'sizing-kit',
              productName: 'Heirest Ring Sizing Kit',
              sku: 'KIT-RG-ALU-17SZ',
              priceUSD: 19,
              quantity: 1,
              config: { category: 'RG', style: 'SL', caratWeight: 0 }
            }
          ],
          shippingAddress: {
            fullName: 'India Moxley',
            phone: '+61 400 123 456',
            street: '42 Balmoral Avenue',
            city: 'Sydney',
            state: 'NSW',
            postalCode: '2041',
            country: 'Australia'
          }
        });

      expect(checkoutRes.status).toBe(201);
      const order = checkoutRes.body;
      const paymentId = `pay_kit_${Date.now()}`;
      const validSignature = crypto
        .createHmac('sha256', env.RAZORPAY_KEY_SECRET)
        .update(`${order.razorpayOrderId}|${paymentId}`)
        .digest('hex');

      // 2. Capture payment
      const verifyRes = await request(app)
        .post('/api/v1/orders/verify-payment')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          orderId: order.id,
          razorpayOrderId: order.razorpayOrderId,
          razorpayPaymentId: paymentId,
          razorpaySignature: validSignature
        });

      expect(verifyRes.status).toBe(200);
      expect(verifyRes.body.order.sizingKitVoucherGenerated).toBeDefined();
      expect(verifyRes.body.order.sizingKitVoucherGenerated).toContain('HEIREST-KIT-');

      const generatedVoucher = verifyRes.body.order.sizingKitVoucherGenerated;

      // 3. Verify user profile has voucher code saved and unredeemed
      const user = await prisma.user.findUnique({ where: { id: testUserId } });
      expect(user?.sizingKitVoucherCode).toBe(generatedVoucher);
      expect(user?.sizingKitRedeemed).toBe(false);

      // 4. Use the generated $19 voucher on next bespoke ring purchase
      const ringOrderRes = await request(app)
        .post('/api/v1/orders/checkout')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          items: [
            {
              id: 'ci-ring-04',
              productId: 'rg-sig-5s-001',
              sku: 'RG-5S-CLW-OV-10018YG-WLD',
              priceUSD: 2000,
              quantity: 1
            }
          ],
          shippingAddress: {
            fullName: 'India Moxley',
            street: '42 Balmoral Avenue',
            city: 'Sydney',
            state: 'NSW',
            postalCode: '2041',
            country: 'Australia'
          },
          sizingKitVoucherCode: generatedVoucher
        });

      expect(ringOrderRes.status).toBe(201);
      expect(ringOrderRes.body.voucherApplied).toBe(true);
      expect(ringOrderRes.body.voucherDiscount).toBe(19);
      expect(ringOrderRes.body.totalUSD).toBe(1981); // 2000 - 19

      // Verify user voucher status marked redeemed
      const updatedUser = await prisma.user.findUnique({ where: { id: testUserId } });
      expect(updatedUser?.sizingKitRedeemed).toBe(true);
    });
  });

  describe('Payment Failure, Order Cancellation, and Refunds', () => {
    it('POST /orders/payment-failed updates payment status to FAILED and audits failure details', async () => {
      const checkoutRes = await request(app)
        .post('/api/v1/orders/checkout')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          items: [{ id: 'ci-fail', productId: 'rg-001', priceUSD: 1500, quantity: 1 }],
          shippingAddress: { fullName: 'India Moxley' }
        });

      const order = checkoutRes.body;

      const failRes = await request(app)
        .post('/api/v1/orders/payment-failed')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          orderId: order.id,
          razorpayOrderId: order.razorpayOrderId,
          errorCode: 'BAD_REQUEST_ERROR',
          errorDescription: 'Card payment was declined by the issuing bank'
        });

      expect(failRes.status).toBe(200);
      expect(failRes.body.order.paymentStatus).toBe('FAILED');
      expect(failRes.body.order.orderStatus).toBe('PENDING_PAYMENT');
    });

    it('POST /orders/:id/cancel cancels an order and sets cancellationReason', async () => {
      const checkoutRes = await request(app)
        .post('/api/v1/orders/checkout')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          items: [{ id: 'ci-cancel', productId: 'rg-001', priceUSD: 2400, quantity: 1 }],
          shippingAddress: { fullName: 'India Moxley' }
        });

      const order = checkoutRes.body;

      const cancelRes = await request(app)
        .post(`/api/v1/orders/${order.id}/cancel`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          reason: 'Changed ring style preference before metal casting'
        });

      expect(cancelRes.status).toBe(200);
      expect(cancelRes.body.order.orderStatus).toBe('CANCELLED');
      expect(cancelRes.body.order.cancellationReason).toContain('Changed ring style');
    });

    it('POST /orders/:id/refund refunds a captured order, creates audit record, and updates status to REFUNDED', async () => {
      // 1. Create order
      const checkoutRes = await request(app)
        .post('/api/v1/orders/checkout')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          items: [{ id: 'ci-refund', productId: 'rg-001', priceUSD: 3000, quantity: 1 }],
          shippingAddress: { fullName: 'India Moxley' }
        });

      const order = checkoutRes.body;
      const paymentId = `pay_mock_${Date.now()}`;
      const validSignature = crypto
        .createHmac('sha256', env.RAZORPAY_KEY_SECRET)
        .update(`${order.razorpayOrderId}|${paymentId}`)
        .digest('hex');

      // 2. Capture payment
      await request(app)
        .post('/api/v1/orders/verify-payment')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          orderId: order.id,
          razorpayOrderId: order.razorpayOrderId,
          razorpayPaymentId: paymentId,
          razorpaySignature: validSignature
        });

      // 3. Initiate refund
      const refundRes = await request(app)
        .post(`/api/v1/orders/${order.id}/refund`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          reason: 'Client requested full return under 60-day guarantee'
        });

      expect(refundRes.status).toBe(200);
      expect(refundRes.body.order.paymentStatus).toBe('REFUNDED');
      expect(refundRes.body.order.refundId).toBeDefined();

      // Check DB audit record
      const refundTx = await prisma.paymentTransaction.findFirst({
        where: { orderId: order.id, status: 'REFUNDED' }
      });
      expect(refundTx).toBeDefined();
    });
  });

  describe('Razorpay Webhook Endpoint', () => {
    it('rejects webhooks with invalid x-razorpay-signature with 400', async () => {
      const res = await request(app)
        .post('/api/v1/orders/webhook')
        .set('x-razorpay-signature', 'fake_signature')
        .send({ event: 'payment.captured', payload: {} });

      expect(res.status).toBe(400);
      expect(res.body.error.message).toContain('Invalid Razorpay webhook signature');
    });

    it('accepts webhooks with valid HMAC signature and processes payment.captured', async () => {
      // 1. Create order
      const checkoutRes = await request(app)
        .post('/api/v1/orders/checkout')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          items: [{ id: 'ci-wh', productId: 'rg-001', priceUSD: 1800, quantity: 1 }],
          shippingAddress: { fullName: 'India Moxley' }
        });

      const order = checkoutRes.body;
      const webhookPayload = {
        event: 'payment.captured',
        payload: {
          payment: {
            entity: {
              id: `pay_webhook_${Date.now()}`,
              order_id: order.razorpayOrderId,
              amount: 180000,
              currency: 'USD',
              status: 'captured',
              method: 'netbanking'
            }
          }
        }
      };

      const rawBody = JSON.stringify(webhookPayload);
      const signature = crypto
        .createHmac('sha256', env.RAZORPAY_WEBHOOK_SECRET)
        .update(rawBody)
        .digest('hex');

      const webhookRes = await request(app)
        .post('/api/v1/orders/webhook')
        .set('Content-Type', 'application/json')
        .set('x-razorpay-signature', signature)
        .send(webhookPayload);

      expect(webhookRes.status).toBe(200);
      expect(webhookRes.body.received).toBe(true);

      // Verify order was transitioned to PLACED / CAPTURED
      const updatedOrder = await prisma.order.findUnique({
        where: { id: order.id }
      });
      expect(updatedOrder?.orderStatus).toBe('PLACED');
      expect(updatedOrder?.paymentStatus).toBe('CAPTURED');
    });
  });
});
