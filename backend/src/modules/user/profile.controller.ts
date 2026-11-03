import { asyncHandler } from '../../utils/asyncHandler.js';
import { userService } from './user.service.js';

export const profileController = {
  getProfile: asyncHandler(async (req, res) => {
    const profile = await userService.getProfile(req.user!.id);
    res.status(200).json(profile);
  }),

  updateProfile: asyncHandler(async (req, res) => {
    const updated = await userService.updateProfile(req.user!.id, req.body);
    res.status(200).json(updated);
  })
};
