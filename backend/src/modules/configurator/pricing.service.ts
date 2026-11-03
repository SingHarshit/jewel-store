import { pricingCache } from '../../config/cache.js';
import { prisma } from '../../config/db.js';
import { ApiError } from '../../utils/ApiError.js';
import type { JewelryConfigInput } from './sku.service.js';

export const pricingService = {
  async calculatePrice(productId: string, config: JewelryConfigInput) {
    const [product, matrix] = await Promise.all([
      prisma.baseProduct.findFirst({
        where: { OR: [{ id: productId }, { slug: productId }] }
      }),
      pricingCache.get()
    ]);

    if (!product) {
      throw new ApiError(404, `Product not found: ${productId}`);
    }

    const metalWeight = Number(product.metalWeightGrams) || 4.0;
    const craftsmanshipFee = Number(product.baseCraftsmanshipFee) || 500;

    const purity = config.metalPurity || '18K';
    const color = config.metalColor || 'YG';
    const stone = config.stone || 'WLD';
    const cut = config.cut || 'RND';
    const caratWeight = Number(config.caratWeight) || 1.0;
    const stoneCount = Number(config.stoneCount) || 1;
    const quantity = Number(config.quantity) || 1;

    // 1. Metal Price calculation
    const baseMetalRate = matrix.metalRates[purity] ?? 75;
    const colorMultiplier = matrix.metalColorPremium[color] ?? 1.0;
    const metalCost = metalWeight * baseMetalRate * colorMultiplier;

    // 2. Stone Price calculation
    const baseStoneRate = matrix.stoneTypeRate[stone] ?? 1800;
    const cutMultiplier = matrix.cutPremiumMultiplier[cut] ?? 1.0;
    const stoneCost = baseStoneRate * caratWeight * cutMultiplier * stoneCount;

    // 3. Craftsmanship / labor fee
    const unitPriceUSD = Math.round(craftsmanshipFee + metalCost + stoneCost);
    const totalPriceUSD = unitPriceUSD * quantity;

    return {
      productId: product.id,
      productName: product.name,
      priceUSD: unitPriceUSD,
      totalPriceUSD,
      breakdown: {
        craftsmanshipFee,
        metalCost: Math.round(metalCost),
        stoneCost: Math.round(stoneCost),
        metalWeightGrams: metalWeight,
        purity,
        color,
        stone,
        caratWeight,
        stoneCount,
        quantity
      }
    };
  }
};
