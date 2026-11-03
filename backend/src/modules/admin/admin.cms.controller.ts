import { asyncHandler } from '../../utils/asyncHandler.js';
import { adminService } from './admin.service.js';

export const adminCmsController = {
  get: asyncHandler(async (_req, res) => {
    const cms = await adminService.getCmsSettings();
    res.status(200).json(cms);
  }),

  update: asyncHandler(async (req, res) => {
    const updated = await adminService.updateCmsSettings(req.body);
    res.status(200).json(updated);
  })
};
