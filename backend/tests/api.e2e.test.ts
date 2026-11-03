import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { prisma } from '../src/config/db.js';

describe('Heirest Jewelry API E2E Suite (Prisma + PostgreSQL)', () => {
  let customerToken: string;
  let adminToken: string;
  let testUserId: string;
  let savedDesignId: string;
  let createdOrderId: string;
  let vaultItemId: string;

  beforeAll(async () => {
    // 1. Authenticate Demo Customer
    const customerRes = await request(app).post('/api/v1/auth/demo/customer');
    expect(customerRes.status).toBe(200);
    customerToken = customerRes.body.token;
    testUserId = customerRes.body.user.id;

    // 2. Authenticate Demo Admin
    const adminRes = await request(app).post('/api/v1/auth/demo/admin');
    expect(adminRes.status).toBe(200);
    adminToken = adminRes.body.token;
  });

  // ── 1. System Health & DB Connection ────────────────────────
  describe('Health Check', () => {
    it('verifies PostgreSQL database connection and returns 200', async () => {
      const res = await request(app).get('/api/v1/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('healthy');
      expect(res.body.database).toContain('PostgreSQL');
    });
  });

  // ── 2. Auth & User Queries ──────────────────────────────────
  describe('Authentication Module', () => {
    const testEmail = `test-${Date.now()}@heirest.co`;

    it('POST /auth/register creates a new customer and returns token', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: testEmail,
          password: 'securePassword123',
          firstName: 'Bespoke',
          lastName: 'Client',
          authorHandle: `@bespoke${Math.floor(100 + Math.random() * 900)}`
        });

      expect(res.status).toBe(201);
      expect(res.body.user).toBeDefined();
      expect(res.body.token).toBeDefined();
      expect(res.body.user.role).toBe('customer');
    });

    it('POST /auth/register rejects duplicate email with 409 Conflict', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: testEmail,
          password: 'anotherPassword123'
        });

      expect(res.status).toBe(409);
    });

    it('POST /auth/login verifies password with bcrypt and returns token', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testEmail,
          password: 'securePassword123'
        });

      expect(res.status).toBe(200);
      expect(res.body.token).toBeDefined();
    });

    it('POST /auth/login rejects wrong password with 401', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testEmail,
          password: 'wrongPassword'
        });

      expect(res.status).toBe(401);
    });

    it('GET /auth/me returns current user with Prisma relations count', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.user).toBeDefined();
      expect(res.body.user.email).toBe('india@heirest.co');
      expect(res.body.user._count).toBeDefined();
      expect(typeof res.body.user._count.designs).toBe('number');
    });

    it('GET /auth/me rejects unauthenticated request with 401', async () => {
      const res = await request(app).get('/api/v1/auth/me');
      expect(res.status).toBe(401);
    });
  });

  // ── 3. RBAC Security Middleware ─────────────────────────────
  describe('RBAC Middleware', () => {
    it('blocks Customer from accessing Admin endpoints with 403 Forbidden', async () => {
      const res = await request(app)
        .get('/api/v1/admin/orders')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(403);
    });

    it('allows Admin to access protected Admin endpoints with 200', async () => {
      const res = await request(app)
        .get('/api/v1/admin/orders')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  // ── 4. Catalog Module (BaseProduct Prisma Queries) ───────────
  describe('Catalog Module', () => {
    it('GET /catalog lists all 12 base products', async () => {
      const res = await request(app).get('/api/v1/catalog');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(12);
    });

    it('GET /catalog/:slug returns single product details by slug', async () => {
      const res = await request(app).get('/api/v1/catalog/signature-5-stone-ring');
      expect(res.status).toBe(200);
      expect(res.body.slug).toBe('signature-5-stone-ring');
      expect(res.body.name).toBe('Signature 5-Stone Ring');
      expect(res.body.availableMetals).toContain('18K');
    });

    it('GET /catalog?category=RG filters products by category', async () => {
      const res = await request(app).get('/api/v1/catalog?category=RG');
      expect(res.status).toBe(200);
      expect(res.body.every((p: any) => p.category === 'RG')).toBe(true);
    });
  });

  // ── 5. Configurator, SKU & Pricing Engine ────────────────────
  describe('Configurator & Pricing Engine', () => {
    const sampleConfig = {
      category: 'RG',
      style: '5S',
      setting: 'CLW',
      cut: 'OV',
      caratWeight: 1.0,
      metalPurity: '18K',
      metalColor: 'YG',
      stone: 'WLD',
      stoneCount: 5,
      quantity: 1
    };

    it('POST /configurator/sku/encode produces canonical SKU', async () => {
      const res = await request(app)
        .post('/api/v1/configurator/sku/encode')
        .send(sampleConfig);

      expect(res.status).toBe(200);
      expect(res.body.sku).toBe('RG-5S-CLW-OV-10018KYG-WLD');
    });

    it('GET /configurator/sku/decode/:sku correctly parses SKU components', async () => {
      const res = await request(app).get(
        '/api/v1/configurator/sku/decode/RG-5S-CLW-OV-10018KYG-WLD'
      );
      expect(res.status).toBe(200);
      expect(res.body.config.category).toBe('RG');
      expect(res.body.config.cut).toBe('OV');
      expect(res.body.config.caratWeight).toBe(1.0);
    });

    it('POST /configurator/calculate calculates parametric price breakdown from PostgreSQL PricingMatrix', async () => {
      const res = await request(app)
        .post('/api/v1/configurator/calculate')
        .send({
          productId: 'rg-sig-5s-001',
          config: sampleConfig
        });

      expect(res.status).toBe(200);
      expect(res.body.priceUSD).toBeGreaterThan(0);
      expect(res.body.breakdown).toBeDefined();
      expect(res.body.breakdown.craftsmanshipFee).toBeGreaterThan(0);
      expect(res.body.breakdown.metalCost).toBeGreaterThan(0);
      expect(res.body.breakdown.stoneCost).toBeGreaterThan(0);
    });

    it('GET /configurator/currency/convert converts USD amounts using cached fxRates', async () => {
      const res = await request(app).get(
        '/api/v1/configurator/currency/convert?amount=1000&currency=GBP'
      );
      expect(res.status).toBe(200);
      expect(res.body.targetCurrency).toBe('GBP');
      expect(res.body.exchangeRate).toBe(0.78);
      expect(res.body.convertedAmount).toBe(780);
    });
  });

  // ── 6. User Profile, Saved Designs & Digital Vault ───────────
  describe('User Module (Profile, Designs, Vault)', () => {
    it('GET /user/profile retrieves full profile with finger sizing and voucher info', async () => {
      const res = await request(app)
        .get('/api/v1/user/profile')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.email).toBe('india@heirest.co');
      expect(res.body.sizingKitVoucherCode).toBe('HEIREST-KIT-19');
      expect(Array.isArray(res.body.fingerSizes)).toBe(true);
    });

    it('PATCH /user/profile updates finger sizes', async () => {
      const newSizes = [
        { hand: 'left', finger: 'ring', size: 'M' },
        { hand: 'right', finger: 'index', size: 'P' }
      ];

      const res = await request(app)
        .patch('/api/v1/user/profile')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ fingerSizes: newSizes });

      expect(res.status).toBe(200);
      expect(res.body.fingerSizes).toEqual(newSizes);
    });

    it('POST /user/designs saves a personalized design in PostgreSQL', async () => {
      const res = await request(app)
        .post('/api/v1/user/designs')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          productId: 'rg-sig-5s-001',
          config: {
            category: 'RG',
            style: '5S',
            setting: 'CLW',
            cut: 'OV',
            caratWeight: 1.0,
            metalPurity: '18K',
            metalColor: 'YG',
            stone: 'WLD',
            priceUSD: 5840
          },
          notes: 'E2E Test Saved Ring'
        });

      expect(res.status).toBe(201);
      expect(res.body.id).toBeDefined();
      expect(res.body.sku).toBeDefined();
      savedDesignId = res.body.id;
    });

    it('GET /user/designs lists the user saved designs', async () => {
      const res = await request(app)
        .get('/api/v1/user/designs')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.some((d: any) => d.id === savedDesignId)).toBe(true);
    });

    it('DELETE /user/designs/:id deletes the saved design', async () => {
      const res = await request(app)
        .delete(`/api/v1/user/designs/${savedDesignId}`)
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('GET /user/vault returns Digital Vault items and certificates', async () => {
      const res = await request(app)
        .get('/api/v1/user/vault')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
      vaultItemId = res.body[0].id;
      expect(res.body[0].certificateNumber).toBeDefined();
      expect(res.body[0].stoneGradingReport).toBeDefined();
    });

    it('POST /user/vault/:id/resize submits a 60-day complimentary resize request', async () => {
      const res = await request(app)
        .post(`/api/v1/user/vault/${vaultItemId}/resize`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ targetSize: 'N½' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.item.resizingUsed).toBe(true);
    });
  });

  // ── 7. Orders & 8-Stage Tracker (Prisma $transaction) ────────
  describe('Orders Module (Checkout, Tracker, CAD Approval)', () => {
    it('POST /orders/checkout creates an order via Prisma $transaction & initializes 8 stages', async () => {
      const res = await request(app)
        .post('/api/v1/orders/checkout')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          items: [
            {
              id: 'ci-e2e-1',
              productId: 'rg-sig-5s-001',
              sku: 'RG-5S-CLW-OV-10018YG-WLD',
              priceUSD: 5840,
              quantity: 1,
              config: { category: 'RG', style: '5S', metalPurity: '18K' }
            }
          ],
          shippingAddress: {
            name: 'India Moxley',
            line1: '42 Balmoral Avenue',
            city: 'Sydney',
            state: 'NSW',
            postcode: '2041',
            country: 'Australia'
          },
          sizingKitVoucherCode: 'HEIREST-KIT-19'
        });

      expect(res.status).toBe(201);
      expect(res.body.id).toBeDefined();
      expect(res.body.orderNumber).toContain('HRS-');
      expect(res.body.voucherApplied).toBe(true);
      expect(res.body.currentStage).toBe('specs_locked');
      expect(res.body.stages.length).toBe(8);
      createdOrderId = res.body.id;
    });

    it('GET /orders lists active customer orders', async () => {
      const res = await request(app)
        .get('/api/v1/orders')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.some((o: any) => o.id === createdOrderId)).toBe(true);
    });

    it('POST /orders/:id/approve-cad approves 3D CAD render and advances pipeline to metal_casting', async () => {
      const res = await request(app)
        .post(`/api/v1/orders/${createdOrderId}/approve-cad`)
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.order.cadRenderApproved).toBe(true);
      expect(res.body.order.currentStage).toBe('metal_casting');
    });
  });

  // ── 8. Admin Module (CRUD, Pricing, Order Pipeline, CMS) ──────
  describe('Admin Module', () => {
    let createdAdminProductId: string;

    it('POST /admin/products creates a new base jewelry product', async () => {
      const res = await request(app)
        .post('/api/v1/admin/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Crown Solitaire Ring',
          slug: `crown-solitaire-ring-${Date.now()}`,
          category: 'RG',
          style: 'SL',
          shortDescription: 'Six-prong crown setting celebrating lab-grown excellence.',
          baseCraftsmanshipFee: 720,
          metalWeightGrams: 3.8,
          availableMetals: ['14K', '18K', 'PT950'],
          availableMetalColors: ['YG', 'WG'],
          availableStones: ['WLD', 'SAP'],
          availableCuts: ['RND', 'OV'],
          availableSettings: ['CLW'],
          availableCaratWeights: [1.0, 1.5, 2.0]
        });

      expect(res.status).toBe(201);
      expect(res.body.id).toBeDefined();
      createdAdminProductId = res.body.id;
    });

    it('PATCH /admin/products/:id updates the product in PostgreSQL', async () => {
      const res = await request(app)
        .patch(`/api/v1/admin/products/${createdAdminProductId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ isBestseller: true, baseCraftsmanshipFee: 750 });

      expect(res.status).toBe(200);
      expect(res.body.isBestseller).toBe(true);
      expect(Number(res.body.baseCraftsmanshipFee)).toBe(750);
    });

    it('DELETE /admin/products/:id deletes the product', async () => {
      const res = await request(app)
        .delete(`/api/v1/admin/products/${createdAdminProductId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('GET /admin/pricing and PATCH /admin/pricing updates matrix and invalidates cache', async () => {
      const getRes = await request(app)
        .get('/api/v1/admin/pricing')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(getRes.status).toBe(200);

      const patchRes = await request(app)
        .patch('/api/v1/admin/pricing')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ diamondRate: 1850 });

      expect(patchRes.status).toBe(200);
      expect(Number(patchRes.body.diamondRate)).toBe(1850);
    });

    it('PATCH /admin/orders/:id/stage advances pipeline stage to QUALITY_CONTROL with tracking', async () => {
      const res = await request(app)
        .patch(`/api/v1/admin/orders/${createdOrderId}/stage`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          stage: 'QUALITY_CONTROL',
          trackingNumber: 'DHL-EXPRESS-998877'
        });

      expect(res.status).toBe(200);
      expect(res.body.currentStage).toBe('QUALITY_CONTROL');
      expect(res.body.trackingNumber).toBe('DHL-EXPRESS-998877');
    });

    it('GET /admin/cms and PATCH /admin/cms updates storefront banner and hero settings', async () => {
      const patchRes = await request(app)
        .patch('/api/v1/admin/cms')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          announcementBarText: 'BESPOKE JEWELRY ATELIER • COMPLIMENTARY WORLDWIDE DELIVERY',
          sizingKitPrice: 40.0
        });

      expect(patchRes.status).toBe(200);
      expect(patchRes.body.announcementBarText).toContain('BESPOKE JEWELRY ATELIER');
      expect(patchRes.body.sizingKitPrice).toBe(40);
    });

    it('POST /admin/vault/issue issues a certified Digital Vault piece', async () => {
      const res = await request(app)
        .post('/api/v1/admin/vault/issue')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          userId: testUserId,
          orderId: createdOrderId,
          productName: 'Signature 5-Stone Ring',
          sku: 'RG-5S-CLW-OV-10018YG-WLD',
          config: { category: 'RG', style: '5S' },
          priceUSD: 5840,
          insuranceValuation: 7200,
          stoneGradingReport: {
            lab: 'IGI',
            reportNumber: 'IGI-2026-E2E-TEST',
            shape: 'OV',
            caratWeight: 1.0,
            color: 'D',
            clarity: 'VVS1',
            cut: 'Ideal'
          }
        });

      expect(res.status).toBe(201);
      expect(res.body.certificateNumber).toContain('HRS-CERT-');
      expect(res.body.stoneGradingReport.lab).toBe('IGI');
    });
  });
});
