import { prisma } from './db.js';

export interface CachedPricing {
  id: string;
  metalRates: Record<string, number>;
  metalColorPremium: Record<string, number>;
  diamondRate: number;
  stoneTypeRate: Record<string, number>;
  cutPremiumMultiplier: Record<string, number>;
  fxRates: Record<string, number>;
  updatedAt: Date;
}

let cachedMatrix: CachedPricing | null = null;
let lastFetchedAt = 0;
const CACHE_TTL_MS = 60 * 1000; // 1 minute background re-check

export const pricingCache = {
  async get(): Promise<CachedPricing> {
    const now = Date.now();
    if (cachedMatrix && now - lastFetchedAt < CACHE_TTL_MS) {
      return cachedMatrix;
    }

    const matrix = await prisma.pricingMatrix.findFirst({
      orderBy: { updatedAt: 'desc' }
    });

    if (!matrix) {
      // Default fallback matrix if database is fresh
      cachedMatrix = {
        id: 'default',
        metalRates: { '9K': 35, '14K': 55, '18K': 75, PT950: 85 },
        metalColorPremium: { YG: 1.0, WG: 1.05, RG: 1.05, PT: 1.1 },
        diamondRate: 1800,
        stoneTypeRate: {
          WLD: 1800,
          NTD: 2400,
          SAP: 1200,
          EMR: 1400,
          RBY: 1500,
          AQM: 900,
          MRG: 850,
          OPA: 750
        },
        cutPremiumMultiplier: {
          RND: 1.0,
          OV: 1.05,
          EMC: 1.08,
          PR: 1.04,
          HT: 1.06,
          MQ: 1.05,
          CU: 1.03,
          AS: 1.07
        },
        fxRates: { USD: 1, AUD: 1.52, GBP: 0.78, EUR: 0.92, INR: 83.5, AED: 3.67, CAD: 1.36 },
        updatedAt: new Date()
      };
      return cachedMatrix;
    }

    cachedMatrix = {
      id: matrix.id,
      metalRates: matrix.metalRates as Record<string, number>,
      metalColorPremium: (matrix.metalColorPremium ?? { YG: 1.0, WG: 1.05, RG: 1.05, PT: 1.1 }) as Record<string, number>,
      diamondRate: Number(matrix.diamondRate),
      stoneTypeRate: (matrix.stoneTypeRate ?? { WLD: 1800, NTD: 2400, SAP: 1200, EMR: 1400, RBY: 1500, AQM: 900, MRG: 850, OPA: 750 }) as Record<string, number>,
      cutPremiumMultiplier: (matrix.cutPremiumMultiplier ?? { RND: 1.0, OV: 1.05, EMC: 1.08, PR: 1.04, HT: 1.06, MQ: 1.05, CU: 1.03, AS: 1.07 }) as Record<string, number>,
      fxRates: matrix.fxRates as Record<string, number>,
      updatedAt: matrix.updatedAt
    };
    lastFetchedAt = now;
    return cachedMatrix;
  },

  invalidate() {
    cachedMatrix = null;
    lastFetchedAt = 0;
  }
};
