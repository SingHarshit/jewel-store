import { pricingCache } from '../../config/cache.js';

export const currencyService = {
  async convert(amountUSD: number, targetCurrency: string) {
    const matrix = await pricingCache.get();
    const code = targetCurrency.toUpperCase();
    const rate = matrix.fxRates[code] ?? 1.0;

    const symbols: Record<string, string> = {
      USD: '$',
      AUD: 'A$',
      GBP: '£',
      EUR: '€',
      INR: '₹',
      AED: 'AED ',
      CAD: 'CA$'
    };

    const convertedAmount = Math.round(amountUSD * rate);

    return {
      sourceCurrency: 'USD',
      sourceAmount: amountUSD,
      targetCurrency: code,
      exchangeRate: rate,
      convertedAmount,
      formatted: `${symbols[code] ?? ''}${convertedAmount.toLocaleString()}`
    };
  },

  async getAllRates() {
    const matrix = await pricingCache.get();
    return {
      base: 'USD',
      rates: matrix.fxRates,
      updatedAt: matrix.updatedAt
    };
  }
};
