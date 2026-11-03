import { prisma } from '../../config/db.js';
import { ApiError } from '../../utils/ApiError.js';
import { skuService } from '../configurator/sku.service.js';

export const userService = {
  // ── Profile ───────────────────────────────────────────────
  async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        authorHandle: true,
        avatarUrl: true,
        membershipTier: true,
        role: true,
        sizingKitVoucherCode: true,
        sizingKitRedeemed: true,
        savedSizes: true,
        preferredChainLengths: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    const name = [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email.split('@')[0];
    const initials = name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

    return {
      id: user.id,
      email: user.email,
      name,
      firstName: user.firstName,
      lastName: user.lastName,
      authorHandle: user.authorHandle ?? `@${user.email.split('@')[0]}`,
      avatarInitials: initials,
      avatarUrl: user.avatarUrl,
      membershipTier: user.membershipTier,
      role: user.role.toLowerCase(),
      fingerSizes: (user.savedSizes as any[]) ?? [],
      savedSizes: (user.savedSizes as any[]) ?? [],
      preferredChainLengths: user.preferredChainLengths ?? [18, 20],
      sizingKitVoucherCode: user.sizingKitVoucherCode,
      sizingKitRedeemed: user.sizingKitRedeemed,
      memberSince: user.createdAt.toISOString()
    };
  },

  async updateProfile(
    userId: string,
    data: {
      name?: string;
      firstName?: string;
      lastName?: string;
      authorHandle?: string;
      fingerSizes?: any[];
      savedSizes?: any[];
      preferredChainLengths?: number[];
      sizingKitRedeemed?: boolean;
    }
  ) {
    if (data.authorHandle) {
      const handle = data.authorHandle.startsWith('@') ? data.authorHandle : `@${data.authorHandle}`;
      const existing = await prisma.user.findFirst({
        where: {
          authorHandle: handle,
          id: { not: userId }
        }
      });
      if (existing) {
        throw new ApiError(409, 'Author handle is already taken');
      }
      data.authorHandle = handle;
    }

    let firstName = data.firstName;
    let lastName = data.lastName;
    if (data.name && !firstName) {
      const parts = data.name.trim().split(' ');
      firstName = parts[0];
      lastName = parts.slice(1).join(' ') || undefined;
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(firstName !== undefined ? { firstName } : {}),
        ...(lastName !== undefined ? { lastName } : {}),
        ...(data.authorHandle !== undefined ? { authorHandle: data.authorHandle } : {}),
        ...(data.fingerSizes !== undefined || data.savedSizes !== undefined
          ? { savedSizes: data.fingerSizes ?? data.savedSizes }
          : {}),
        ...(data.preferredChainLengths !== undefined ? { preferredChainLengths: data.preferredChainLengths } : {}),
        ...(data.sizingKitRedeemed !== undefined ? { sizingKitRedeemed: data.sizingKitRedeemed } : {})
      }
    });

    return this.getProfile(updated.id);
  },

  // ── Saved Designs ──────────────────────────────────────────
  async getSavedDesigns(userId: string) {
    const designs = await prisma.savedDesign.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });

    return designs.map((d) => ({
      id: d.id,
      productId: d.productId,
      productName: d.productName,
      config: d.config,
      sku: d.sku,
      priceUSD: Number(d.priceUSD),
      savedAt: d.createdAt.toISOString(),
      authorHandle: d.authorHandle,
      shareUrl: d.shareUrl ?? `https://heirest.com/configure/${d.productId}?sku=${d.sku}`,
      notes: d.notes
    }));
  },

  async saveDesign(userId: string, input: { productId: string; config: any; handle?: string; notes?: string }) {
    const product = await prisma.baseProduct.findFirst({
      where: { OR: [{ id: input.productId }, { slug: input.productId }] }
    });

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new ApiError(404, 'User not found');

    const sku = skuService.encode(input.config);
    const authorHandle = input.handle || user.authorHandle || `@${user.email.split('@')[0]}`;
    const productName = product?.name || 'Bespoke Jewelry Piece';

    const design = await prisma.savedDesign.create({
      data: {
        productId: product?.id || input.productId,
        productName,
        sku,
        config: input.config,
        priceUSD: Number(input.config.priceUSD || 5000),
        authorHandle,
        shareUrl: `https://heirest.com/configure/${product?.slug || input.productId}?sku=${sku}`,
        notes: input.notes,
        isPublic: true,
        userId
      }
    });

    return {
      id: design.id,
      productId: design.productId,
      productName: design.productName,
      config: design.config,
      sku: design.sku,
      priceUSD: Number(design.priceUSD),
      savedAt: design.createdAt.toISOString(),
      authorHandle: design.authorHandle,
      shareUrl: design.shareUrl,
      notes: design.notes
    };
  },

  async deleteDesign(userId: string, designId: string) {
    const design = await prisma.savedDesign.findUnique({
      where: { id: designId }
    });

    if (!design || design.userId !== userId) {
      throw new ApiError(404, 'Saved design not found');
    }

    await prisma.savedDesign.delete({ where: { id: designId } });
    return { success: true, message: 'Design deleted successfully' };
  },

  // ── Digital Vault & 60-Day Resize ──────────────────────────
  async getVaultItems(userId: string) {
    const items = await prisma.vaultItem.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });

    return items.map((v) => ({
      id: v.id,
      orderId: v.orderId,
      productId: v.productId,
      productName: v.productName,
      sku: v.sku,
      config: v.config,
      purchasedAt: v.purchasedAt.toISOString(),
      priceUSD: Number(v.priceUSD),
      certificateNumber: v.certificateNumber,
      stoneGradingReport: v.stoneGradingReport,
      insuranceValuation: Number(v.insuranceValuation),
      resizingUsed: v.resizingUsed,
      resizeRequested: v.resizeRequested,
      inspectionDue: v.inspectionDue?.toISOString() ?? new Date(Date.now() + 180 * 86400000).toISOString()
    }));
  },

  async getVaultCertificate(certificateNumber: string) {
    const item = await prisma.vaultItem.findUnique({
      where: { certificateNumber }
    });

    if (!item) {
      throw new ApiError(404, `Certificate not found: ${certificateNumber}`);
    }

    return {
      certificateNumber: item.certificateNumber,
      productName: item.productName,
      sku: item.sku,
      config: item.config,
      purchasedAt: item.purchasedAt.toISOString(),
      stoneGradingReport: item.stoneGradingReport,
      insuranceValuation: Number(item.insuranceValuation),
      resizingUsed: item.resizingUsed,
      inspectionDue: item.inspectionDue?.toISOString()
    };
  },

  async request60DayResize(userId: string, vaultItemId: string, targetSize: string) {
    const item = await prisma.vaultItem.findFirst({
      where: { id: vaultItemId, userId }
    });

    if (!item) {
      throw new ApiError(404, 'Vault item not found');
    }

    if (item.resizingUsed) {
      throw new ApiError(400, 'Complimentary 60-day resize has already been redeemed for this item');
    }

    // Verify within 60 days of purchase (allow demo bypass if older)
    const daysSincePurchase = (Date.now() - item.purchasedAt.getTime()) / (1000 * 60 * 60 * 24);
    const isWithin60Days = daysSincePurchase <= 60;

    const updated = await prisma.vaultItem.update({
      where: { id: item.id },
      data: {
        resizeRequested: true,
        resizingUsed: true,
        resizeRequestDetails: {
          requestedSize: targetSize,
          requestedAt: new Date().toISOString(),
          status: 'PENDING_COURIER_PICKUP',
          withinPolicy: isWithin60Days
        }
      }
    });

    return {
      success: true,
      message: 'Complimentary 60-day resize request submitted successfully',
      item: {
        id: updated.id,
        certificateNumber: updated.certificateNumber,
        resizingUsed: updated.resizingUsed,
        resizeRequested: updated.resizeRequested,
        resizeDetails: updated.resizeRequestDetails
      }
    };
  }
};
