import { asyncHandler } from '../../utils/asyncHandler.js';
import { currencyService } from './currency.service.js';
import { pricingService } from './pricing.service.js';
import { skuService } from './sku.service.js';

export const configuratorController = {
  calculatePricing: asyncHandler(async (req, res) => {
    const { productId, config } = req.body;
    const result = await pricingService.calculatePrice(productId, config);
    res.status(200).json(result);
  }),

  encodeSku: asyncHandler(async (req, res) => {
    const sku = skuService.encode(req.body);
    res.status(200).json({ sku });
  }),

  decodeSku: asyncHandler(async (req, res) => {
    const config = skuService.decode(req.params.sku || req.body.sku);
    res.status(200).json({ config });
  }),

  convertCurrency: asyncHandler(async (req, res) => {
    const amount = Number(req.query.amount ?? req.body.amount ?? 0);
    const currency = String(req.query.currency ?? req.body.currency ?? 'USD');
    const result = await currencyService.convert(amount, currency);
    res.status(200).json(result);
  }),

  getFxRates: asyncHandler(async (_req, res) => {
    const rates = await currencyService.getAllRates();
    res.status(200).json(rates);
  })
};
