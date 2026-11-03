import { asyncHandler } from '../../utils/asyncHandler.js';
import { userService } from './user.service.js';

export const vaultController = {
  getVault: asyncHandler(async (req, res) => {
    const items = await userService.getVaultItems(req.user!.id);
    res.status(200).json(items);
  }),

  getCertificate: asyncHandler(async (req, res) => {
    const certNumber = Array.isArray(req.params.certificateNumber)
      ? req.params.certificateNumber[0]
      : req.params.certificateNumber;
    const cert = await userService.getVaultCertificate(certNumber);
    res.status(200).json(cert);
  }),

  requestResize: asyncHandler(async (req, res) => {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const targetSize = req.body.targetSize || req.body.size || 'N';
    const result = await userService.request60DayResize(req.user!.id, id, targetSize);
    res.status(200).json(result);
  })
};
