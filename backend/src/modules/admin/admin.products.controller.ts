import { asyncHandler } from '../../utils/asyncHandler.js';
import { adminService } from './admin.service.js';

export const adminProductsController = {
  getAll: asyncHandler(async (_req, res) => {
    const products = await adminService.getAllProducts();
    res.status(200).json(products);
  }),

  create: asyncHandler(async (req, res) => {
    const product = await adminService.createProduct(req.body);
    res.status(201).json(product);
  }),

  update: asyncHandler(async (req, res) => {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const product = await adminService.updateProduct(id, req.body);
    res.status(200).json(product);
  }),

  delete: asyncHandler(async (req, res) => {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const result = await adminService.deleteProduct(id);
    res.status(200).json(result);
  })
};
