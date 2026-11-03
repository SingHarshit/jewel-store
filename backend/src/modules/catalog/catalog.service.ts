import { prisma } from '../../config/db.js';
import { ApiError } from '../../utils/ApiError.js';

export const catalogService = {
  async getAllProducts(filters?: {
    category?: string;
    tag?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }) {
    const where: any = { isActive: true };

    if (filters?.category && filters.category.toLowerCase() !== 'all') {
      where.category = { equals: filters.category.toUpperCase() };
    }

    if (filters?.tag) {
      where.tags = { has: filters.tag.toLowerCase() };
    }

    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { shortDescription: { contains: filters.search, mode: 'insensitive' } }
      ];
    }

    const [items, total] = await Promise.all([
      prisma.baseProduct.findMany({
        where,
        take: filters?.limit ?? 50,
        skip: filters?.offset ?? 0,
        orderBy: [{ isBestseller: 'desc' }, { isNew: 'desc' }, { name: 'asc' }]
      }),
      prisma.baseProduct.count({ where })
    ]);

    return { items, total };
  },

  async getProductBySlug(slug: string) {
    const product = await prisma.baseProduct.findFirst({
      where: {
        OR: [{ slug }, { id: slug }]
      }
    });

    if (!product) {
      throw new ApiError(404, `Product not found: ${slug}`);
    }

    return product;
  },

  async getCategories() {
    const products = await prisma.baseProduct.findMany({
      where: { isActive: true },
      select: { category: true }
    });

    const categories = Array.from(new Set(products.map((p) => p.category)));
    return categories;
  }
};
