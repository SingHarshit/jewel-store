import { OrderStage } from '@prisma/client';
import { pricingCache } from '../../config/cache.js';
import { prisma } from '../../config/db.js';
import { ApiError } from '../../utils/ApiError.js';
import { build8StageTimeline } from '../orders/orders.service.js';

export const adminService = {
  // ── Products CRUD ──────────────────────────────────────────
  async getAllProducts() {
    return prisma.baseProduct.findMany({
      orderBy: { createdAt: 'desc' }
    });
  },

  async createProduct(data: any) {
    const slug = data.slug || data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const existing = await prisma.baseProduct.findUnique({ where: { slug } });
    if (existing) {
      throw new ApiError(409, `Product with slug '${slug}' already exists`);
    }

    return prisma.baseProduct.create({
      data: {
        slug,
        name: data.name,
        category: data.category,
        style: data.style,
        shortDescription: data.shortDescription,
        baseCraftsmanshipFee: Number(data.baseCraftsmanshipFee || 500),
        metalWeightGrams: Number(data.metalWeightGrams || 4.0),
        availableMetals: data.availableMetals ?? ['9K', '14K', '18K', 'PT950'],
        availableMetalColors: data.availableMetalColors ?? ['YG', 'WG', 'RG'],
        availableStones: data.availableStones ?? ['WLD', 'SAP', 'EMR', 'RBY'],
        availableCuts: data.availableCuts ?? ['RND', 'OV', 'EMC'],
        availableSettings: data.availableSettings ?? ['CLW', 'BEZ'],
        availableCaratWeights: data.availableCaratWeights ?? [0.5, 1.0, 1.5, 2.0],
        defaultConfig: data.defaultConfig ?? {},
        imagePlaceholderColor: data.imagePlaceholderColor ?? '#C5A880',
        studioImageUrl: data.studioImageUrl,
        lifestyleImageUrl: data.lifestyleImageUrl,
        tags: data.tags ?? [],
        isActive: data.isActive !== undefined ? data.isActive : true,
        isBestseller: data.isBestseller ?? false,
        isNew: data.isNew ?? false
      }
    });
  },

  async updateProduct(id: string, data: any) {
    const product = await prisma.baseProduct.findFirst({
      where: { OR: [{ id }, { slug: id }] }
    });
    if (!product) throw new ApiError(404, 'Product not found');

    return prisma.baseProduct.update({
      where: { id: product.id },
      data: {
        ...(data.name ? { name: data.name } : {}),
        ...(data.shortDescription ? { shortDescription: data.shortDescription } : {}),
        ...(data.baseCraftsmanshipFee !== undefined ? { baseCraftsmanshipFee: Number(data.baseCraftsmanshipFee) } : {}),
        ...(data.metalWeightGrams !== undefined ? { metalWeightGrams: Number(data.metalWeightGrams) } : {}),
        ...(data.availableMetals ? { availableMetals: data.availableMetals } : {}),
        ...(data.availableMetalColors ? { availableMetalColors: data.availableMetalColors } : {}),
        ...(data.availableStones ? { availableStones: data.availableStones } : {}),
        ...(data.availableCuts ? { availableCuts: data.availableCuts } : {}),
        ...(data.availableSettings ? { availableSettings: data.availableSettings } : {}),
        ...(data.availableCaratWeights ? { availableCaratWeights: data.availableCaratWeights } : {}),
        ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
        ...(data.isBestseller !== undefined ? { isBestseller: data.isBestseller } : {}),
        ...(data.isNew !== undefined ? { isNew: data.isNew } : {})
      }
    });
  },

  async deleteProduct(id: string) {
    const product = await prisma.baseProduct.findFirst({
      where: { OR: [{ id }, { slug: id }] }
    });
    if (!product) throw new ApiError(404, 'Product not found');

    await prisma.baseProduct.delete({ where: { id: product.id } });
    return { success: true, message: `Product ${product.slug} deleted` };
  },

  // ── Pricing Matrix ─────────────────────────────────────────
  async getPricingMatrix() {
    return pricingCache.get();
  },

  async updatePricingMatrix(data: any) {
    let matrix = await prisma.pricingMatrix.findFirst({
      orderBy: { updatedAt: 'desc' }
    });

    if (!matrix) {
      matrix = await prisma.pricingMatrix.create({
        data: {
          metalRates: data.metalRates ?? {},
          metalColorPremium: data.metalColorPremium ?? {},
          diamondRate: data.diamondRate ?? 1800,
          stoneTypeRate: data.stoneTypeRate ?? {},
          cutPremiumMultiplier: data.cutPremiumMultiplier ?? {},
          fxRates: data.fxRates ?? {}
        }
      });
    } else {
      matrix = await prisma.pricingMatrix.update({
        where: { id: matrix.id },
        data: {
          ...(data.metalRates ? { metalRates: data.metalRates } : {}),
          ...(data.metalColorPremium ? { metalColorPremium: data.metalColorPremium } : {}),
          ...(data.diamondRate !== undefined ? { diamondRate: Number(data.diamondRate) } : {}),
          ...(data.stoneTypeRate ? { stoneTypeRate: data.stoneTypeRate } : {}),
          ...(data.cutPremiumMultiplier ? { cutPremiumMultiplier: data.cutPremiumMultiplier } : {}),
          ...(data.fxRates ? { fxRates: data.fxRates } : {})
        }
      });
    }

    pricingCache.invalidate();
    return matrix;
  },

  // ── Order Pipeline ─────────────────────────────────────────
  async getAllOrders() {
    return prisma.order.findMany({
      include: { user: { select: { id: true, email: true, authorHandle: true } } },
      orderBy: { createdAt: 'desc' }
    });
  },

  async updateOrderStage(orderId: string, targetStage: string, trackingNumber?: string) {
    const stageEnum = targetStage.toUpperCase() as OrderStage;
    if (!Object.values(OrderStage).includes(stageEnum)) {
      throw new ApiError(400, `Invalid order stage: ${targetStage}`);
    }

    const order = await prisma.order.findFirst({
      where: { OR: [{ id: orderId }, { orderNumber: orderId }] }
    });
    if (!order) throw new ApiError(404, 'Order not found');

    const updatedStages = build8StageTimeline(stageEnum, true);

    return prisma.order.update({
      where: { id: order.id },
      data: {
        currentStage: stageEnum,
        stages: updatedStages,
        ...(trackingNumber ? { trackingNumber } : {})
      }
    });
  },

  // ── Vault Certificate Issuer ───────────────────────────────
  async issueVaultCertificate(payload: {
    userId: string;
    orderId?: string;
    productName: string;
    sku: string;
    config: any;
    priceUSD: number;
    insuranceValuation: number;
    stoneGradingReport: any;
  }) {
    const randomCert = Math.floor(1000 + Math.random() * 9000);
    const certificateNumber = `HRS-CERT-${new Date().getFullYear()}-${randomCert}`;

    return prisma.vaultItem.create({
      data: {
        certificateNumber,
        userId: payload.userId,
        orderId: payload.orderId,
        productName: payload.productName,
        sku: payload.sku,
        config: payload.config,
        priceUSD: payload.priceUSD,
        insuranceValuation: payload.insuranceValuation,
        stoneGradingReport: payload.stoneGradingReport,
        resizingUsed: false,
        inspectionDue: new Date(Date.now() + 180 * 86400000)
      }
    });
  },

  // ── Storefront CMS ─────────────────────────────────────────
  async getCmsSettings() {
    let cms = await prisma.storefrontCms.findFirst();
    if (!cms) {
      cms = await prisma.storefrontCms.create({
        data: {
          announcementBarVisible: true,
          announcementBarText: 'COMPLIMENTARY WORLDWIDE INSURED COURIER ON ALL BESPOKE COMMISSIONS',
          sizingKitPrice: 35.0,
          heroHeadline: 'Sculpted by You, Perfected by Masters',
          heroSubheadline: 'Parametric fine jewelry crafted in solid gold and lab-grown stones',
          heroMediaUrl: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&q=80&w=1200'
        }
      });
    }
    return {
      id: cms.id,
      announcementBarVisible: cms.announcementBarVisible,
      announcementBarText: cms.announcementBarText,
      sizingKitPrice: Number(cms.sizingKitPrice),
      heroHeadline: cms.heroHeadline,
      heroSubheadline: cms.heroSubheadline,
      heroMediaUrl: cms.heroMediaUrl
    };
  },

  async updateCmsSettings(data: any) {
    let cms = await prisma.storefrontCms.findFirst();
    if (!cms) {
      cms = await prisma.storefrontCms.create({ data });
    } else {
      cms = await prisma.storefrontCms.update({
        where: { id: cms.id },
        data: {
          ...(data.announcementBarVisible !== undefined ? { announcementBarVisible: data.announcementBarVisible } : {}),
          ...(data.announcementBarText ? { announcementBarText: data.announcementBarText } : {}),
          ...(data.sizingKitPrice !== undefined ? { sizingKitPrice: Number(data.sizingKitPrice) } : {}),
          ...(data.heroHeadline ? { heroHeadline: data.heroHeadline } : {}),
          ...(data.heroSubheadline ? { heroSubheadline: data.heroSubheadline } : {}),
          ...(data.heroMediaUrl ? { heroMediaUrl: data.heroMediaUrl } : {})
        }
      });
    }

    return {
      id: cms.id,
      announcementBarVisible: cms.announcementBarVisible,
      announcementBarText: cms.announcementBarText,
      sizingKitPrice: Number(cms.sizingKitPrice),
      heroHeadline: cms.heroHeadline,
      heroSubheadline: cms.heroSubheadline,
      heroMediaUrl: cms.heroMediaUrl
    };
  }
};
