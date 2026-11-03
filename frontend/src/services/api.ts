import axios from 'axios';
import type {
  JewelryProduct,
  JewelryConfig,
  Order,
  OrderStage,
  SavedDesign,
  UserProfile,
  User,
  AuthResponse,
  LoginPayload,
  RegisterPayload,
  PricingRates,
  CmsSettings,
  VaultItem,
  CheckoutPayload,
  RazorpayVerificationPayload,
  PaymentFailurePayload,
} from '../types/jewelry';
import { MOCK_CATALOG } from '../data/mockCatalog';
import { MOCK_ORDERS, MOCK_SAVED_DESIGNS, MOCK_USER_PROFILE } from '../data/mockUserData';

const BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5000/api/v1' : '/api/v1');

const client = axios.create({
  baseURL: BASE_URL,
  timeout: 8000,
  headers: { 'Content-Type': 'application/json' },
});

// ── Auto-attach Bearer token ─────────────────────────────────
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('heirest-token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ---------------------------------------------------------------
// Fallback-aware API wrapper
// ---------------------------------------------------------------
async function withFallback<T>(apiFn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await apiFn();
  } catch {
    return fallback;
  }
}

// ---------------------------------------------------------------
// DEMO Customer account (pre-loaded for 1-click testing)
// ---------------------------------------------------------------
export const DEMO_USER: User = {
  id: 'demo-001',
  firstName: 'India',
  lastName: 'Moxley',
  email: 'india@heirest.co',
  authorHandle: '@indiemoxley',
  membershipTier: 'Collector',
  role: 'customer',
  sizingKitVoucherCode: 'HEIREST-KIT-19',
  savedSizes: [
    { hand: 'left', finger: 'ring', size: 'N' },
    { hand: 'right', finger: 'index', size: 'O' },
  ],
  createdAt: '2024-03-15T10:00:00Z',
};

// ---------------------------------------------------------------
// DEMO Admin account (pre-loaded for 1-click admin testing)
// ---------------------------------------------------------------
export const DEMO_ADMIN: User = {
  id: 'admin-001',
  firstName: 'Heirest',
  lastName: 'Admin',
  email: 'admin@heirest.com',
  authorHandle: '@heirest_admin',
  membershipTier: 'Founding Author',
  role: 'admin',
  createdAt: '2023-01-01T00:00:00Z',
};

const DEMO_TOKEN = 'mock-jwt-demo-collector-token';
const DEMO_ADMIN_TOKEN = 'mock-jwt-admin-heirest-token';

// Internal type for mock localStorage user (with hashed password)
type MockUserRecord = User & { _password?: string };


// ── localStorage mock persistence helpers ─────────────────────
function getMockUsers(): MockUserRecord[] {
  try {
    return JSON.parse(localStorage.getItem('heirest-mock-users') ?? '[]');
  } catch {
    return [];
  }
}
function saveMockUsers(users: MockUserRecord[]): void {
  localStorage.setItem('heirest-mock-users', JSON.stringify(users));
}

function generateHandle(firstName: string, lastName: string): string {
  const base = `@${firstName.toLowerCase()}${lastName.toLowerCase().slice(0, 4)}`;
  return base.replace(/[^a-z@]/g, '');
}

function buildTokenFor(userId: string): string {
  return `mock-jwt-${userId}-${Date.now()}`;
}

// ---------------------------------------------------------------
// Auth API  (tries real backend → falls back to localStorage mock)
// ---------------------------------------------------------------
export const authApi = {
  /** POST /auth/register */
  register: (payload: RegisterPayload): Promise<AuthResponse> =>
    withFallback(
      async () => (await client.post<AuthResponse>('/auth/register', payload)).data,
      (() => {
        const users = getMockUsers();
        if (users.find((u) => u.email === payload.email)) {
          throw new Error('Email already registered');
        }
        const newUser: User = {
          id: `usr-${Date.now()}`,
          firstName: payload.firstName,
          lastName: payload.lastName,
          email: payload.email,
          authorHandle: payload.authorHandle
            ? `@${payload.authorHandle.replace(/^@/, '')}`
            : generateHandle(payload.firstName, payload.lastName),
          membershipTier: 'Private Client',
          role: 'customer',
          sizingKitVoucherCode: `HEIREST-KIT-${Math.floor(10 + Math.random() * 90)}`,
          savedSizes: [],
          createdAt: new Date().toISOString(),
        };
        const record: MockUserRecord = { ...newUser, _password: payload.password };
        saveMockUsers([...users, record]);
        const token = buildTokenFor(newUser.id);
        localStorage.setItem('heirest-token', token);
        localStorage.setItem('heirest-auth-user', JSON.stringify(newUser));
        return { user: newUser, token };
      })()
    ),

  /** POST /auth/login */
  login: (payload: LoginPayload): Promise<AuthResponse> =>
    withFallback(
      async () => (await client.post<AuthResponse>('/auth/login', payload)).data,
      (() => {
        // Check if logging in as admin
        if (payload.email === 'admin@heirest.com') {
          localStorage.setItem('heirest-token', DEMO_ADMIN_TOKEN);
          localStorage.setItem('heirest-auth-user', JSON.stringify(DEMO_ADMIN));
          return { user: DEMO_ADMIN, token: DEMO_ADMIN_TOKEN };
        }
        const users = getMockUsers();
        const found = users.find(
          (u) =>
            u.email === payload.email &&
            (payload.password === undefined || u._password === payload.password)
        );
        if (!found) throw new Error('Invalid credentials');
        const { _password: _p, ...user } = found as MockUserRecord;
        void _p;
        const token = buildTokenFor(user.id);
        localStorage.setItem('heirest-token', token);
        localStorage.setItem('heirest-auth-user', JSON.stringify(user));
        return { user, token };
      })()
    ),

  /** POST /auth/magic-link  (simulated OTP — always succeeds in demo) */
  requestMagicLink: (email: string): Promise<{ sent: boolean }> =>
    withFallback(
      async () =>
        (await client.post<{ sent: boolean }>('/auth/magic-link', { email })).data,
      { sent: true }
    ),

  /** POST /auth/magic-link/verify */
  verifyOtp: (email: string, otpCode: string): Promise<AuthResponse> =>
    withFallback(
      async () =>
        (await client.post<AuthResponse>('/auth/magic-link/verify', { email, otpCode })).data,
      (() => {
        // Any 6-digit code passes in demo
        if (otpCode.length !== 6) throw new Error('Invalid OTP');
        const users = getMockUsers();
        const found = users.find((u: any) => u.email === email);
        const user: User = found
          ? (found as any)
          : {
              id: `usr-otp-${Date.now()}`,
              firstName: email.split('@')[0],
              lastName: '',
              email,
              authorHandle: `@${email.split('@')[0]}`,
              membershipTier: 'Private Client' as const,
              role: 'customer' as const,
              sizingKitVoucherCode: `HEIREST-KIT-${Math.floor(10 + Math.random() * 90)}`,
              savedSizes: [],
              createdAt: new Date().toISOString(),
            };
        const token = buildTokenFor(user.id);
        localStorage.setItem('heirest-token', token);
        localStorage.setItem('heirest-auth-user', JSON.stringify(user));
        return { user, token };
      })()
    ),

  /** POST /auth/oauth/google  (simulated) */
  loginWithGoogle: (): Promise<AuthResponse> =>
    withFallback(
      async () => (await client.post<AuthResponse>('/auth/oauth/google')).data,
      (() => {
        const user: User = {
          id: `usr-google-${Date.now()}`,
          firstName: 'Sofia',
          lastName: 'Laurent',
          email: `sofia.laurent.${Date.now()}@gmail.com`,
          authorHandle: '@sofialaurent',
          membershipTier: 'Private Client',
          role: 'customer',
          sizingKitVoucherCode: `HEIREST-KIT-${Math.floor(10 + Math.random() * 90)}`,
          savedSizes: [],
          createdAt: new Date().toISOString(),
        };
        const token = buildTokenFor(user.id);
        localStorage.setItem('heirest-token', token);
        localStorage.setItem('heirest-auth-user', JSON.stringify(user));
        return { user, token };
      })()
    ),

  /** POST /auth/oauth/apple  (simulated) */
  loginWithApple: (): Promise<AuthResponse> =>
    withFallback(
      async () => (await client.post<AuthResponse>('/auth/oauth/apple')).data,
      (() => {
        const user: User = {
          id: `usr-apple-${Date.now()}`,
          firstName: 'Charlotte',
          lastName: 'Ashworth',
          email: `charlotte.ashworth.${Date.now()}@icloud.com`,
          authorHandle: '@charlotteashworth',
          membershipTier: 'Private Client',
          role: 'customer',
          sizingKitVoucherCode: `HEIREST-KIT-${Math.floor(10 + Math.random() * 90)}`,
          savedSizes: [],
          createdAt: new Date().toISOString(),
        };
        const token = buildTokenFor(user.id);
        localStorage.setItem('heirest-token', token);
        localStorage.setItem('heirest-auth-user', JSON.stringify(user));
        return { user, token };
      })()
    ),

  /** 1-click Demo Customer login  (@indiemoxley) */
  loginAsDemo: (): AuthResponse => {
    localStorage.setItem('heirest-token', DEMO_TOKEN);
    localStorage.setItem('heirest-auth-user', JSON.stringify(DEMO_USER));
    return { user: DEMO_USER, token: DEMO_TOKEN };
  },

  /** 1-click Demo Admin login  (admin@heirest.com) */
  loginAsAdmin: (): AuthResponse => {
    localStorage.setItem('heirest-token', DEMO_ADMIN_TOKEN);
    localStorage.setItem('heirest-auth-user', JSON.stringify(DEMO_ADMIN));
    return { user: DEMO_ADMIN, token: DEMO_ADMIN_TOKEN };
  },

  /** GET /auth/me  — validates token on app load */
  me: (): Promise<User | null> =>
    withFallback(
      async () => (await client.get<User>('/auth/me')).data,
      (() => {
        const raw = localStorage.getItem('heirest-auth-user');
        if (!raw) return null;
        try { return JSON.parse(raw) as User; } catch { return null; }
      })()
    ),

  /** POST /auth/logout */
  logout: (): Promise<void> =>
    withFallback(
      async () => { await client.post('/auth/logout'); },
      (() => {
        localStorage.removeItem('heirest-token');
        localStorage.removeItem('heirest-auth-user');
      })()
    ),
};

// ---------------------------------------------------------------
// Products API
// ---------------------------------------------------------------
export const productsApi = {
  getAll: () =>
    withFallback(
      async () => (await client.get<JewelryProduct[]>('/products')).data,
      MOCK_CATALOG
    ),

  getBySlug: (slug: string) =>
    withFallback(
      async () => (await client.get<JewelryProduct>(`/products/${slug}`)).data,
      MOCK_CATALOG.find((p) => p.slug === slug) ?? null
    ),

  getByCategory: (category: string) =>
    withFallback(
      async () =>
        (await client.get<JewelryProduct[]>(`/products?category=${category}`)).data,
      category === 'all'
        ? MOCK_CATALOG
        : MOCK_CATALOG.filter((p) => p.category === category.toUpperCase().slice(0, 2))
    ),
};

// ---------------------------------------------------------------
// Orders API
// ---------------------------------------------------------------
export const ordersApi = {
  getAll: () =>
    withFallback(
      async () => (await client.get<Order[]>('/orders')).data,
      MOCK_ORDERS
    ),

  getById: (id: string) =>
    withFallback(
      async () => (await client.get<Order>(`/orders/${id}`)).data,
      MOCK_ORDERS.find((o) => o.id === id) ?? null
    ),

  checkout: (payload: CheckoutPayload) =>
    withFallback(
      async () => (await client.post<any>('/orders/checkout', payload)).data,
      (() => {
        const subtotal = payload.items.reduce(
          (sum, item) => sum + (item.priceUSD || 2500) * (item.quantity || 1),
          0
        );
        const discount = payload.sizingKitVoucherCode ? 19 : 0;
        const total = Math.max(0, subtotal - discount);
        const randomNum = Math.floor(1000 + Math.random() * 9000);
        const orderNumber = `HRS-${new Date().getFullYear()}-${randomNum}`;
        const razorpayOrderId = `order_mock_${Date.now().toString(36)}`;

        return {
          id: `ord-local-${Date.now()}`,
          orderNumber,
          totalUSD: total,
          totalAmount: total,
          amountInCents: Math.round(total * 100),
          currency: payload.currency || 'USD',
          orderStatus: 'PENDING_PAYMENT' as const,
          paymentStatus: 'PENDING' as const,
          razorpayOrderId,
          razorpayKeyId: 'rzp_test_HeirestDemoKey2026',
          currentStage: 'specs_locked' as const,
          stages: [
            { stage: 'specs_locked', label: '01. Specs Locked', description: 'Your configuration has been confirmed and sent to our design studio.', isActive: true, isPending: false },
            { stage: 'cad_approval', label: '02. 3D CAD Render Approval', description: 'Our master jeweller has created a precision 3D CAD render.', isActive: false, isPending: true },
            { stage: 'metal_casting', label: '03. Metal Casting', description: 'Your ring is being cast in solid gold.', isActive: false, isPending: true },
            { stage: 'stone_selection', label: '04. Hand-Picked Stone Selection', description: 'Our gemologist hand-selects your stone.', isActive: false, isPending: true },
            { stage: 'master_setting', label: '05. Master Setting', description: 'Your stone is hand-set by our master setter.', isActive: false, isPending: true },
            { stage: 'hand_polishing', label: '06. Hand Polishing', description: 'Your piece is brought to a mirror finish.', isActive: false, isPending: true },
            { stage: 'quality_control', label: '07. 8-Point Quality Control', description: 'Independent gemological inspection.', isActive: false, isPending: true },
            { stage: 'dispatched', label: '08. Insured DHL Express Dispatch', description: 'Your piece ships fully insured.', isActive: false, isPending: true }
          ],
          voucherApplied: discount > 0,
          voucherDiscount: discount,
          placedAt: new Date().toISOString()
        };
      })()
    ),

  verifyPayment: (payload: RazorpayVerificationPayload) =>
    withFallback(
      async () => (await client.post<any>('/orders/verify-payment', payload)).data,
      (() => {
        return {
          success: true,
          message: 'Payment verified and captured. 8-stage manufacturing pipeline unlocked.',
          order: {
            id: payload.orderId,
            orderStatus: 'PLACED',
            paymentStatus: 'CAPTURED',
            currentStage: 'specs_locked',
            razorpayPaymentId: payload.razorpayPaymentId,
            razorpayOrderId: payload.razorpayOrderId
          },
          sizingKitVoucherGenerated: `HEIREST-KIT-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
        };
      })()
    ),

  reportPaymentFailure: (payload: PaymentFailurePayload) =>
    withFallback(
      async () => (await client.post<any>('/orders/payment-failed', payload)).data,
      { success: false, message: 'Payment recorded as failed.' }
    ),

  cancelOrder: (orderId: string, reason?: string) =>
    withFallback(
      async () => (await client.post<any>(`/orders/${orderId}/cancel`, { reason })).data,
      { success: true, message: 'Order cancelled successfully' }
    ),

  refundOrder: (orderId: string, reason?: string, amount?: number) =>
    withFallback(
      async () => (await client.post<any>(`/orders/${orderId}/refund`, { reason, amount })).data,
      { success: true, message: 'Refund initiated', refundId: `rfnd_${Date.now()}` }
    ),

  approveCad: (orderId: string) =>
    withFallback(
      async () =>
        (await client.post<{ success: boolean }>(`/orders/${orderId}/approve-cad`)).data,
      { success: true }
    ),
};

// ---------------------------------------------------------------
// Designs API
// ---------------------------------------------------------------
export const designsApi = {
  getAll: () =>
    withFallback(
      async () => (await client.get<SavedDesign[]>('/designs')).data,
      MOCK_SAVED_DESIGNS
    ),

  save: (productId: string, config: JewelryConfig, handle: string) =>
    withFallback(
      async () =>
        (await client.post<SavedDesign>('/designs', { productId, config, handle })).data,
      null
    ),

  delete: (id: string) =>
    withFallback(
      async () =>
        (await client.delete<{ success: boolean }>(`/designs/${id}`)).data,
      { success: true }
    ),
};

// ---------------------------------------------------------------
// User API
// ---------------------------------------------------------------
export const userApi = {
  getProfile: () =>
    withFallback(
      async () => (await client.get<UserProfile>('/user/profile')).data,
      MOCK_USER_PROFILE
    ),

  updateProfile: (data: Partial<UserProfile>) =>
    withFallback(
      async () => (await client.patch<UserProfile>('/user/profile', data)).data,
      { ...MOCK_USER_PROFILE, ...data }
    ),
};

// ---------------------------------------------------------------
// Pricing API
// ---------------------------------------------------------------
export const pricingApi = {
  calculate: (productId: string, config: JewelryConfig) =>
    withFallback(
      async () =>
        (await client.post<{ priceUSD: number }>('/pricing/calculate', { productId, config }))
          .data,
      null
    ),
};

// ---------------------------------------------------------------
// ADMIN API — typed REST methods with local fallback
// ---------------------------------------------------------------
export const adminApi = {
  /** POST /api/v1/admin/products */
  createProduct: (product: Partial<JewelryProduct>): Promise<JewelryProduct> =>
    withFallback(
      async () => (await client.post<JewelryProduct>('/admin/products', product)).data,
      { ...product, id: `prod-${Date.now()}` } as JewelryProduct
    ),

  /** PUT /api/v1/admin/products/:id */
  updateProduct: (id: string, updates: Partial<JewelryProduct>): Promise<JewelryProduct> =>
    withFallback(
      async () => (await client.put<JewelryProduct>(`/admin/products/${id}`, updates)).data,
      { id, ...updates } as JewelryProduct
    ),

  /** DELETE /api/v1/admin/products/:id */
  deleteProduct: (id: string): Promise<{ success: boolean }> =>
    withFallback(
      async () => (await client.delete<{ success: boolean }>(`/admin/products/${id}`)).data,
      { success: true }
    ),

  /** PUT /api/v1/admin/pricing-matrix */
  updatePricingMatrix: (rates: PricingRates): Promise<PricingRates> =>
    withFallback(
      async () => (await client.put<PricingRates>('/admin/pricing-matrix', rates)).data,
      rates
    ),

  /** PATCH /api/v1/admin/orders/:id/stage */
  advanceOrderStage: (orderId: string, stage: OrderStage): Promise<Order> =>
    withFallback(
      async () =>
        (await client.patch<Order>(`/admin/orders/${orderId}/stage`, { stage })).data,
      MOCK_ORDERS.find((o) => o.id === orderId) as Order
    ),

  /** POST /api/v1/admin/vault/issue-certificate */
  issueCertificate: (orderId: string): Promise<VaultItem> =>
    withFallback(
      async () =>
        (await client.post<VaultItem>('/admin/vault/issue-certificate', { orderId })).data,
      null as unknown as VaultItem
    ),

  /** PUT /api/v1/admin/cms/settings */
  updateCmsSettings: (settings: Partial<CmsSettings>): Promise<CmsSettings> =>
    withFallback(
      async () => (await client.put<CmsSettings>('/admin/cms/settings', settings)).data,
      settings as CmsSettings
    ),
};
