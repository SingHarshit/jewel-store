import { asyncHandler } from '../../utils/asyncHandler.js';
import { catalogService } from './catalog.service.js';

export const catalogController = {
  getAll: asyncHandler(async (req, res) => {
    const filters = {
      category: req.query.category as string | undefined,
      tag: req.query.tag as string | undefined,
      search: req.query.search as string | undefined,
      limit: req.query.limit ? Number(req.query.limit) : undefined,
      offset: req.query.offset ? Number(req.query.offset) : undefined
    };
    const result = await catalogService.getAllProducts(filters);
    if (req.query.category || req.path === '/') {
      res.status(200).json(result.items);
    } else {
      res.status(200).json(result);
    }
  }),

  getBySlug: asyncHandler(async (req, res) => {
    const slug = Array.isArray(req.params.slug) ? req.params.slug[0] : req.params.slug;
    const product = await catalogService.getProductBySlug(slug);
    res.status(200).json(product);
  }),

  getCategories: asyncHandler(async (_req, res) => {
    const categories = await catalogService.getCategories();
    res.status(200).json(categories);
  })
};
