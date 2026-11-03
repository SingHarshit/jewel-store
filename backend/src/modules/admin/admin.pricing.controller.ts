import { asyncHandler } from '../../utils/asyncHandler.js';
import { adminService } from './admin.service.js';

export const adminPricingController = {
  get: asyncHandler(async (_req, res) => {
    const matrix = await adminService.getPricingMatrix();
    res.status(200).json(matrix);
  }),

  update: asyncHandler(async (req, res) => {
    const updated = await adminService.updatePricingMatrix(req.body);
    res.status(200).json(updated);
  })
};
