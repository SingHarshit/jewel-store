import { asyncHandler } from '../../utils/asyncHandler.js';
import { userService } from './user.service.js';

export const designsController = {
  getAll: asyncHandler(async (req, res) => {
    const designs = await userService.getSavedDesigns(req.user!.id);
    res.status(200).json(designs);
  }),

  save: asyncHandler(async (req, res) => {
    const design = await userService.saveDesign(req.user!.id, req.body);
    res.status(201).json(design);
  }),

  delete: asyncHandler(async (req, res) => {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const result = await userService.deleteDesign(req.user!.id, id);
    res.status(200).json(result);
  })
};
