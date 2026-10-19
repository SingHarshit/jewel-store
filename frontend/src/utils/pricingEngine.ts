import type {
  JewelryConfig,
  PricingRates,
  Currency,
  CurrencyRate,
} from '../types/jewelry';

// ---------------------------------------------------------------
// Pricing rates (USD base)
// ---------------------------------------------------------------
export const PRICING_RATES: PricingRates = {
  metalPurityRate: {
    '9K': 28, // USD per gram (approx 37.5% gold)
    '14K': 43, // 58.3% gold
    '18K': 58, // 75% gold
    PT950: 32, // Platinum per gram
  },
  metalColorPremium: {
    YG: 1.0,
    WG: 1.05, // rhodium plating premium
    RG: 1.02,
    PT: 1.12,
  },
  stoneTypeRate: {
    WLD: 800,   // USD per carat — lab diamond
    NTD: 4500,  // natural diamond
    SAP: 600,
    EMR: 700,
    RBY: 900,
    AQM: 120,
    MRG: 180,
    OPA: 200,
  },
  cutPremiumMultiplier: {
    RND: 1.15, // round brilliant commands premium
    OV: 1.08,
    EMC: 1.06,
    PR: 1.07,
    HT: 1.05,
    MQ: 1.06,
    CU: 1.04,
    AS: 1.05,
  },
};

// ---------------------------------------------------------------
// Currency exchange rates (approximate, relative to USD)
// ---------------------------------------------------------------
export const CURRENCY_RATES: CurrencyRate[] = [
  { code: 'USD', symbol: '$',   name: 'US Dollar',       rateFromUSD: 1.00 },
  { code: 'AUD', symbol: 'A$',  name: 'Australian Dollar', rateFromUSD: 1.53 },
  { code: 'GBP', symbol: '£',   name: 'British Pound',    rateFromUSD: 0.79 },
  { code: 'EUR', symbol: '€',   name: 'Euro',             rateFromUSD: 0.92 },
  { code: 'INR', symbol: '₹',   name: 'Indian Rupee',     rateFromUSD: 83.5 },
  { code: 'AED', symbol: 'AED', name: 'UAE Dirham',       rateFromUSD: 3.67 },
];

export function getCurrencyRate(currency: Currency): CurrencyRate {
  return CURRENCY_RATES.find((r) => r.code === currency) ?? CURRENCY_RATES[0];
}

// ---------------------------------------------------------------
// Real-time parametric price calculator
// Formula: BaseCraftsmanshipFee
//        + (MetalWeightGrams * MetalPurityRate * MetalColorPremium)
//        + (StoneCount * TotalCaratWeight * StoneTypeRate * CutPremium)
// ---------------------------------------------------------------
export function calculatePriceUSD(
  config: JewelryConfig,
  baseCraftsmanshipFee: number,
  metalWeightGrams: number
): number {
  const rates = PRICING_RATES;

  const metalCost =
    metalWeightGrams *
    rates.metalPurityRate[config.metalPurity] *
    rates.metalColorPremium[config.metalColor];

  const stoneCost =
    config.stoneCount *
    config.caratWeight *
    rates.stoneTypeRate[config.stone] *
    rates.cutPremiumMultiplier[config.cut];

  const total = baseCraftsmanshipFee + metalCost + stoneCost;
  return Math.round(total * 100) / 100;
}

export function convertPrice(usdPrice: number, currency: Currency): number {
  const rate = getCurrencyRate(currency);
  return Math.round(usdPrice * rate.rateFromUSD * 100) / 100;
}

export function formatPrice(usdPrice: number, currency: Currency): string {
  const rate = getCurrencyRate(currency);
  const converted = convertPrice(usdPrice, currency);
  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(converted);
  return `${rate.symbol}${formatted}`;
}

export function formatBNPL(usdPrice: number, currency: Currency): string {
  const installment = convertPrice(usdPrice / 4, currency);
  const rate = getCurrencyRate(currency);
  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(installment);
  return `${rate.symbol}${formatted}`;
}

export function estimateCraftingDays(config: JewelryConfig): number {
  let days = 21; // base
  if (config.metalPurity === 'PT950') days += 7;
  if (config.stone === 'NTD') days += 5;
  if (config.caratWeight >= 2) days += 5;
  if (config.engraving) days += 2;
  return days;
}

export function estimatedCompletionDate(config: JewelryConfig): string {
  const days = estimateCraftingDays(config);
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}
