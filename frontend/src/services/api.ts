import axios from 'axios';
import type { JewelryProduct, JewelryConfig, Order, SavedDesign, UserProfile } from '../types/jewelry';
import { MOCK_CATALOG } from '../data/mockCatalog';
import { MOCK_ORDERS, MOCK_SAVED_DESIGNS, MOCK_USER_PROFILE } from '../data/mockUserData';

const BASE_URL = 'http://localhost:5000/api/v1';

const client = axios.create({
  baseURL: BASE_URL,
  timeout: 8000,
  headers: { 'Content-Type': 'application/json' },
});

// Auth token injection
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('heirest-token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ---------------------------------------------------------------
// Fallback-aware API wrapper
// Falls back to mock data when backend is unavailable
// ---------------------------------------------------------------
async function withFallback<T>(
  apiFn: () => Promise<T>,
  fallback: T
): Promise<T> {
  try {
    return await apiFn();
  } catch {
    return fallback;
  }
}

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
        (await client.post<{ priceUSD: number }>('/pricing/calculate', { productId, config })).data,
      null
    ),
};
